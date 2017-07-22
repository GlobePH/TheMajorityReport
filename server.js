var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');

////////////////
// Middleware //
////////////////

app.use(express.static('public'));
app.use(bodyParser.json());

////////////////////
// REST endpoints //
////////////////////

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/users.html');
});

app.get('/company', function(req, res) {
	res.sendFile(__dirname + '/company.html');
});

/////////////
// Sockets //
/////////////

io.sockets.on('connection', function (socket) {
	var uid;

	socket.on('requestData', (data) => {
		const googleTrendsParams = {
			keyword: data.product,
			startTime: moment().subtract(1, data.timePeriod).toDate(),
			geo: data.targetCountry,
		};

		googleTrends.interestOverTime(googleTrendsParams).then((results) => {
			io.emit('interestOverTime', {
				to: data.name,
				results,
			});
		}).catch((error) => {
			console.log(error);
		});

		googleTrends.interestByRegion(googleTrendsParams).then((results) => {
			io.emit('interestByRegion', {
				to: data.name,
				results,
			});
		}).catch((error) => {
			console.log(error);
		});

		googleTrends.relatedQueries(googleTrendsParams).then((results) => {
			io.emit('relatedQueries', {
				to: data.name,
				results,
			});
		}).catch((error) => {
			console.log(error);
		});
	});
	

	socket.on('log-in', function (user) {
		// onlineUsers[user] = {
		// 	name: user,
		// };

		// //end conversation
		// var conversingId = _.find(onlineUsers, {
		// 	conversingWith: user,
		// });

		// if(conversingId) {
		// 	onlineUsers[conversingId.uid] = null;
		// 	io.emit('end-conversation', {
		// 		to: user.uid,
		// 		from: conversingId.uid,
		// 	});
		// }

		// find the language
		user.language = _.find(countryLanguageMap, { countryCode: user.baseCountry }).languages.split(',')[0];
		onlineUsers[user.name] = user;
		io.emit('user-logged-in', user.name);
	});

	socket.on('call', function (data) {
		io.emit('receive-call', data);
	});

	socket.on('logout', function (user) {
		delete onlineUsers[user.uid];
		io.emit('online-users', onlineUsers);
	});

	socket.on('save-language-gender', function (data) {
		onlineUsers[data.uid].language = data.language;
		onlineUsers[data.uid].gender = data.gender;
		io.emit('online-users', onlineUsers);
	});

	socket.on('choose-person', function (data) {
		io.emit('choose-person', data);
	});

	socket.on('accept', function (data) {
		onlineUsers[data.to].active = true;
		onlineUsers[data.from].active = true;
		onlineUsers[data.to].conversingWith = data.from;
		onlineUsers[data.from].conversingWith = data.to;
		io.emit('accept', data);
		io.emit('online-users', onlineUsers);
	});

	// socket.on('cache-translation', function (data) {
	// 	var cachedTranslation = _.findWhere(translationCache, {
	// 		source: data.source, 
	// 		sourceCode: data.sourceCode, 
	// 		targetCode: data.targetCode
	// 	});
	// 	if(!cachedTranslation) {
	// 		translationCache.push(cachedTranslation);
	// 		io.emit('translation-cache', translationCache);
	// 	}
	// });

	socket.on('set-mode', function (data) {	
		io.emit('set-mode', data);
	});

	socket.on('send-message', function (data) {
		const fromLanguage = onlineUsers[data.from].language;
		const toLanguage = onlineUsers[data.to].language;
		var cacheObject = {
			source: data.message,
			sourceCode: fromLanguage,
			targetCode: toLanguage,
		};
		var cachedTranslation = _.find(translationCache, cacheObject);
		if(cachedTranslation) {
			data.translated = cachedTranslation.translation;
			console.log('cached', data);
			io.emit('receive-message', data);
		} else {
			googleTranslate.translate(data.message, fromLanguage, toLanguage, function(err, translation) {
				if(err) {
					console.log(err);
					console.log(data.message);
					console.log(fromLanguage);
					console.log(toLanguage);

					// send the message anyway; un-translated
					io.emit('receive-message', data);
				} else {
					cacheObject.translation = translation.translatedText;
					translationCache.push(cacheObject);
					data.translated = translation.translatedText;
					console.log('translated', data);
				  	io.emit('receive-message', data);
				}
			});
		}
	});

	socket.on('reject', function (data) {
		io.emit('reject', data);
	});

	socket.on('end-conversation', function (data) {
		onlineUsers[data.to].active = false;
		onlineUsers[data.from].active = false;
		onlineUsers[data.to].conversingWith = null;
		onlineUsers[data.from].conversingWith = null;
		io.emit('end-conversation', data);
		io.emit('online-users', onlineUsers);
	});

	socket.on('disconnect', function () {
		delete onlineUsers[uid];
		io.emit('online-users', onlineUsers);
	});
});


////////////
// Listen //
////////////

http.listen(5000, function(){
	console.log('Hello! listening on *:5000');
});