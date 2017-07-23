var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var axios = require('axios');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');

const GLOBE_LOCATION_API_BASE_URL = 'https://devapi.globelabs.com.ph/location/v1/queries/location';
const GLOBE_SENDING_API_BASE_URL = 'https://devapi.globelabs.com.ph/smsmessaging/v1/outbound/';
const GLOBE_SHORT_CODE_SUFFIX = '3991';

////////////
// Google //
////////////

// Google Translate
const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyA-ADNiUReO8wOEHpEiqwbgAKHCuGdk2LE';
const googleTranslate = require('google-translate')(GOOGLE_TRANSLATE_API_KEY);

// Google Cloud
const gcloud = require('google-cloud')({
  keyFilename: 'JCTrial-069e36f55c9a.json',
  projectId: 'jctrial-140810'
});

const language = gcloud.language();

////////////////
// Middleware //
////////////////

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));

//////////////
// Firebase //
//////////////

const firebaseAdmin = require('firebase-admin');

let firebaseServiceAccount = require('./majority-report-ca4ad-firebase-adminsdk-jniyu-2e30a76342.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
  databaseURL: 'https://majority-report-ca4ad.firebaseio.com'
});

let firebaseDb = firebaseAdmin.database();

// fetch Twitter hashtags to listen to
var twitterHashtagsDbRef = firebaseDb.ref('twitterHashtags');
twitterHashtagsDbRef.on("value", (snapshot) => {
    // initialize Twitter stream
    var Twitter = require('node-tweet-stream')
        , t = new Twitter(require('./twitter.json'));

    var companyHashtagMap = snapshot.val();

    // get list of keywords
    var keywords = _.values(companyHashtagMap);

    // remove keywords
    t.untrackAll(false);

    // track the new set of keywords
    if (keywords) {
        t.trackMultiple(keywords);
    }

    console.log('listening to tweets');
    console.log(keywords);
    console.log(t.tracking());

    // listen to new tweets
    t.on('tweet', function (tweet) {
        console.log('tweet received', tweet);
        // detect the hashtags present in this tweet
        var companyKeysInvolved = Object.keys(_.pickBy(companyHashtagMap, (hashtag, companyId) => {
            return tweet.text.includes(hashtag);
        }));

        var newReport = {
            tweet_id: tweet.id_str,
            text: tweet.text,
            profile_photo: tweet.user.profile_image_url,
            photo: getPic(tweet),
            name: tweet.user.name,
            source: 'twitter',
            profile_url: tweet.user.url,
            created_at: moment(tweet.created_at).format('YYYY-MM-DD HH:mm:ss'),
        };

        if (tweet.coordinates) {
            newReport.coordinates = tweet.coordinates;
        }

        console.log(newReport);

        // distribute to the proper room through Firebase
        companyKeysInvolved.map((companyKey) => {
            let reportsDbRef = firebaseDb.ref('reports');
            reportsDbRef.child(companyKey).push(newReport);
        });
    });

    t.on('error', function (err) {
        console.log(err);
    });
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

////////////////////
// REST endpoints //
////////////////////

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/home.html');
});

app.get('/company', (req, res) => {
    res.sendFile(__dirname + '/company.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

app.get('/company/:company', (req, res) => {
    res.sendFile(__dirname + '/report.html');
});

app.get('/sms/subscribe', (req, res) => {
    res.json({ ok: true });
    console.log('SOMEONE IS TRYING TO SUBSCRIBE!!!');

    // get DB ref for subscribers
    var subscribersDbRef = firebaseDb.ref('subscribers');

    console.log('OHYEAH!');
    // get access token and subscriber number
    var accessToken = req.query.access_token;
    var subscriberNumber = req.query.subscriber_number;
    console.log(req.query);

    // set the accessToken of the subcriberNumber
    subscribersDbRef.child(subscriberNumber).set(accessToken);
});

app.post('/sms/subscribe', (req, res) => {
    res.json({ ok: true });

    if (req.body.unsubscribed) {
        // get DB ref for subscribers
        var subscribersDbRef = firebaseDb.ref('subscribers');

        console.log(req.body);
        subscribersDbRef.child(req.body.unsubscribed.subscriber_number).remove();
    } else if (req.body.inboundSMSMessageList) {
        receiveMessage(req, res);
    }
});

app.post('/sms/receive', (req, res) => {
    res.json({ ok: true });
    receiveMessage(req, res);
});

/////////////
// Sockets //
/////////////

io.sockets.on('connection', function (socket) {
    var uid;

    socket.on('join', (room) => {
        socket.join(room);
    });

    // socket.on('get-languages', () => {
    //     socket.emit('receive-languages')
    //     // axios.get('https://translation.googleapis.com/language/translate/v2/languages?key=' + GOOGLE_TRANSLATE_API_KEY).then((response) => {
    //     //     socket.emit('receive-languages', response.data.data.languages);
    //     // }).catch((error) => {
    //     //     console.log(error);
    //     // });
    // });

    socket.on('reply', (data) => {
        doIfSubscriber(data.mobile_number, (accessToken) => {
            axios.post(GLOBE_SENDING_API_BASE_URL
                + GLOBE_SHORT_CODE_SUFFIX + '/requests'
                + '?access_token' + accessToken, {
                address: 'tel:+63' + data.mobile_number,
                outboundSMSTextMessage: {
                    message: data.message,
                },
                clientCorrelator: data.replyKey,
            }).then((response) => {
                // do nothing, for now
            }).catch((error) => {
                console.log(error);
            });
        });
    });

    socket.on('translate', ({ companyKey, reportKey }) => {
        console.log('TRANSLATING');
        firebaseDb.ref('reports/' + companyKey + '/' + reportKey).once('value', (snapshot) => {
            const report = snapshot.val();
            console.log(report.text);

            if (report && !report.is_translated && !report.translatedText) {
                googleTranslate.translate(report.text, 'en', (err, translation) => {
                    if (err) {
                        console.log(err);
                    }

                    firebaseDb.ref('reports/' + companyKey + '/' + reportKey + '/is_translated').set('true');
                    firebaseDb.ref('reports/' + companyKey + '/' + reportKey + '/translatedText').set(translation.translatedText);
                });
            }

            console.log(snapshot.val());

            if (report && !report.entities_detected) {
                var languageDocument = language.document(report.text);

                languageDocument.detectEntities(report.text, function(err, entities) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(entities);
                        firebaseDb.ref('reports/' + companyKey + '/' + reportKey + '/entities_detected').set('true');
                        firebaseDb.ref('reports/' + companyKey + '/' + reportKey + '/entities').set(entities);
                    }
                });
            }
        });
    });

    socket.on('disconnect', () => {
    });
});

///////////////
// Functions //
///////////////

function doIfSubscriber(mobileNumber, subscriberCallback, notSubscriberCallback) {
    let subscribersDbRef = firebaseDb.ref('subscribers');
    subscribersDbRef.once('value', (snapshot) => {
        if (snapshot.hasChild(mobileNumber)) {
            // request for the subscriber's location
            subscriberCallback(snapshot.child(mobileNumber).val());
        } else {
            notSubscriberCallback();
        }
    });
}

function getPic(tweet) {
    var newPics = false;
    if (typeof tweet.extended_entities != undefined
        && tweet.extended_entities != undefined
        && typeof tweet.extended_entities.media != undefined) {
        newPics = tweet.extended_entities.media.map(function(val) {
            if (val.type == 'photo' && val.media_url != undefined) {
                return val.media_url;
            }
        });
        newPics.filter(function(val) {
            return val != undefined;
        });
        return newPics[0];
    }
    return newPics;
}

function receiveMessage(req, res) {
    console.log('I RECEIVED IT!!!');
    // if any of these are falsy (undefined, null, false), do nothing
    if (!req
        || !req.body
        || !req.body.inboundSMSMessageList
        || !req.body.inboundSMSMessageList.inboundSMSMessage) {
        console.log('OOPS, MAY MALI');
        console.log(req.body);
        return;
    }

    // expect an array of message, as Globe seems to batch the messages
    const messages = req.body.inboundSMSMessageList.inboundSMSMessage;
    messages.map((message) => {
        // get the slug the SMS is reporting
        const firstWord = message.message.split(' ')[0];
        const companyCode = firstWord.toLowerCase();

        // get companyKey from slug
        codeCompanyKeyMapDbRef = firebaseDb.ref('codeCompanyKeyMap');
        codeCompanyKeyMapDbRef.once('value', (codeCompanyKeyMapSnapshot) => {
            if (codeCompanyKeyMapSnapshot.hasChild(companyCode)) {
                const companyKey = codeCompanyKeyMapSnapshot.child(companyCode).val();
                console.log(companyKey);
                console.log('COMPANY EXISTS!');

                const mobileNumber = message.senderAddress.substr(message.senderAddress.length - 10);
                let newReport = {
                    text: message.message.replace(firstWord + ' ', ''),
                    name: message.senderAddress,
                    source: 'sms',
                    mobile_number: mobileNumber,
                    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                };

                let reportsDbRef = firebaseDb.ref('reports');

                // check if mobileNumber is a subscriber
                doIfSubscriber(mobileNumber, (accessToken) => {
                    axios.get(GLOBE_LOCATION_API_BASE_URL
                        + '?access_token=' + accessToken
                        + '&address=' + mobileNumber
                        + '&requestedAccuracy=' + 50).then((response) => {
                        console.log(response.data);
                        const currentLocation = response.data.terminalLocationList.terminalLocation.currentLocation;
                        newReport.coordinates = {
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        };

                        console.log('Subscriber with location!!!!');

                        // push the report with the subscriber's location
                        reportsDbRef.child(companyKey).push(newReport);
                    }).catch((error) => {
                        console.log(error);
                        console.log('Subscriber without location!!');
                        // push the report without the subscriber's location
                        reportsDbRef.child(companyKey).push(newReport);
                    });
                }, () => {
                    console.log('not a subscriber, but reported anyway!!');
                    reportsDbRef.child(companyKey).push(newReport);
                });
            }
        });
    });
}

////////////
// Listen //
////////////

http.listen(5001, () => {
    console.log('Hello! listening on *:5001');
});