window.$ = window.jQuery = require('jquery');

require('hammerjs');
require('./materialize.js');

window.Vue = require('vue');

window.axios = require('axios');

window._ = require('lodash');

require('./components');

new Vue({
	el: '#app',
	data: {
		activePage: 'login',
		user: {},
		companyKey: '',
		companyCode: '',
		reports: [],
		activeMiniPage: 'map',
		companyHashtag: '',
		defaultResponse: '',
		defaultReport: '',
		defaultReportList: {},
		defaultResponseList: {},
		mapCenter: {
            lat: 11.5563841,
            lng: 118.0615091
		}
	},

	// beforeMount() {
	// 	axios.get('https://translation.googleapis.com/language/translate/v2/languages').then((response) => {
	//         const languages = response.data.data.languages;
	//         this.languages = languages;
	//          // {language: , name: }
	//     }).catch((error) => {
	//     	// this.pushToast('Something went wrong', 'red');
	//     });
	// },

	mounted() {
		// const GOOGLE_TRANSLATE_API_KEY = '';
		// axios.get('https://translation.googleapis.com/language/translate/v2/languages?key=AIzaSyA-ADNiUReO8wOEHpEiqwbgAKHCuGdk2LE').then((response) => {
  //           this.languages = response.data.data.languages;
  //       }).catch((error) => {
  //       	console.log(error);
  //       });
		// socket.emit('get-languages');
		// socket.on('receive-languages', (languages) => {

		// 	this.languages = languages;
		// });

		firebase.database().ref('defaultReports/' + this.companyKey).on('child_added', (data) => {
			this.$set(this.defaultReportList, data.key, data.val());
		});

		firebase.database().ref('defaultReports/' + this.companyKey).on('child_changed', (data) => {
			this.$set(this.defaultReportList, data.key, data.val());
		});

		firebase.database().ref('defaultResponses/' + this.companyKey).on('child_added', (data) => {
			this.$set(this.defaultResponseList, data.key, data.val());
		});

		firebase.database().ref('defaultResponses/' + this.companyKey).on('child_changed', (data) => {
			this.$set(this.defaultResponseList, data.key, data.val());
		});


		// firebase.database().ref('companies/' + this.companyKey).on('child_changed', (data) => {
		// 	this.language= data.val().language;
		// 	alert(data.val());
		// });


		// listen for changes in auth state
		firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				this.user = user;
			} else {
				this.user = {};
			}
		});

		firebase.auth().getRedirectResult().then((result) => {
			if (result.credential) {
				// This gives you a Facebook Access Token. You can use it to access the Facebook API.
				var token = result.credential.accessToken;
				// ...
			}

			if(!this.user) {
				this.pushToast('Successfully Logged In', 'green');
			}
		  	this.user = result.user;
		  	// console.log(result.user);
		  	// alert('yes');
		}).catch((error) => {
		    this.user = {};
		    // console.log(error.message);
			this.pushToast(error.message, 'red');
		});
	},

	watch: {
		activePage(value) {
			if (value == 'map') {
				this.$nextTick(() => {
					$('.button-collapse').sideNav({
						menuWidth: 300, // Default is 300
						edge: 'left', // Choose the horizontal origin
						closeOnClick: true, // Closes side-nav on <a> clicks, useful for Angular/Meteor
						draggable: true, // Choose whether you can drag to open on touch screens,
					});
					$('.dropdown-button').dropdown({
						inDuration: 300,
						outDuration: 225,
						constrainWidth: false, // Does not change width of dropdown to that of the activator
						belowOrigin: true, // Displays dropdown below the button
						alignment: 'left', // Displays dropdown with edge aligned to the left of button
				    });
				    $('.collapsible').collapsible();
				});
			}
		},

		user(newValue) {
			if (newValue
				&& Object.keys(newValue).length > 0
				&& this.activePage == 'login') {
				// alert(newValue.uid);
				firebase.database().ref('admins/' + newValue.uid).once('value', (snapshot) => {
					this.companyKey = snapshot.val();
					this.activePage = 'map';
					// alert(snapshot.val());
			        let reportRef = firebase.database().ref('reports/' + this.companyKey);
			        reportRef.on('child_added', (data) => {
			        	let newObj = Object.assign({}, data.val());
			        	newObj.key = data.key;
			        	// this.$set('reports', Object.assign({}, data.val()));
			        	this.reports.push(Object.assign({}, data.val()));
			        	if (!newObj.is_translated) {
			        		let companyKey = this.companyKey;
			        		socket.emit('translate', { companyKey, reportKey: data.key })
			        	}
			        	// console.log(data.val());
			        });

			        reportRef.on('child_changed', (data) => {
			        	// let newObj = Object.assign({}, data.val());
			        	// newObj.key = data.key;
			        	// this.$set('reports', Object.assign({}, data.val()));
			        	const objToUpdateIndex = _.findIndex(this.reports, {
			        		key: data.key,
			        	});

			        	const updatedObject = data.val();
			        	updatedObject.key = data.key;

			        	this.$set(this.reports, objToUpdateIndex, updatedObject);
			        	if (!updatedObject.is_translated) {
			        		let companyKey = this.companyKey;
			        		socket.emit('translate', { companyKey, reportKey: data.key });
			        	}
			        	// console.log(data.val());
			        });
				}).then(() => {
			        firebase.database().ref('twitterHashtags/' + this.companyKey).on('value', (data) => {
			        	this.companyHashtag= data.val();
			        });
				});
				
		        // firebase.database().ref('codeCompanyKeyMap/' + this.companyKey).on('value', (snapshot) => {
		        //     this.companyCode = snapshot.val();
		        // });			
			}
		},

	},

	methods: {
		setActivePage(value) {
			this.activePage = value;
		},

		forceCenterMap(report) {
			if (report.coordinates) {
				this.mapCenter = {
					lat: report.coordinates.latitude,
					lng: report.coordinates.longitude,
				}
			}
		},	

		setActiveMiniPage(value) {
			this.activeMiniPage = value;
		},

		logoutUser() {
			firebase.auth().signOut().then(() => {
			  this.user = {};
			  this.setActivePage('login');
			  this.pushToast('Successfully Logged Out', 'green');
			}).catch((error) => {
			  // console.log('erroooor');
			  this.pushToast('Something went wrong!', 'red');
			});
		},

		loginWithGoogle() {
			var provider = new firebase.auth.GoogleAuthProvider();
			firebase.auth().signInWithRedirect(provider);
		},

		loginWithFacebook() {
			var provider = new firebase.auth.FacebookAuthProvider();
			firebase.auth().signInWithRedirect(provider);
		},

		loginWithTwitter() {
			var provider = new firebase.auth.TwitterAuthProvider();
			firebase.auth().signInWithRedirect(provider);
		},

	    saveCompanyHastag() {
	    	if (this.companyHashtag != '') {
		        firebase.database().ref('twitterHashtags/' + this.companyKey).set(this.companyHashtag, (test) => {
		        	// alert('yes');
		        	this.pushToast('Successfully updated your hashtag', 'green');
		        });
		    }
	    },

	    addNewReport() {
	    	firebase.database().ref('defaultReports/' + this.companyKey).push(this.defaultReport);
	    	// newPostRef.set();
	    	// alert(newPostRef);
	    	// this.defaultReportList[this.companyKey] = 
	    	this.pushToast('Successfully added default report', 'green');
		    this.defaultReport = '';
	    },


	    addNewResponse() {
	    	firebase.database().ref('defaultResponses/' + this.companyKey).push(this.defaultResponse);
	    	// newPostRef.set();
	    	// alert(newPostRef);
	    	// this.defaultReportList[this.companyKey] = 
	    	this.pushToast('Successfully added default response', 'green');
		    this.defaultResponse = '';
	    },

	    pushToast(message, toastClass) {
	        let $toastContent = $('<span>'+ message +'</span>');
	        Materialize.toast($toastContent, 3000, toastClass);
	    },

	    setCompanyHashtag(value) {
	    	this.companyHashtag = value;
	    },

	}
});