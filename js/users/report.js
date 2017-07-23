require('./bootstrap');
require('./components');

const database = firebase.database();
new Vue({
	
	el: '#app',

	data: {
		activePage: 'main',
		user: {},
		companyKey: '',
		company: {},
		defaultResponses: [
			{text: 'atm ate my card'},
			{text: 'no water'},
			{text: 'cut off internet cables'},
		],
		coordinates: {},
		customMessage: '',
		
	},

	watch: {
		user(newValue) {
			if (newValue && Object.keys(newValue).length > 0) {
				this.activePage = 'main';
			} else {
				this.activePage = 'login';
			}
		},
	},

	mounted() {
		$('.modal').modal();

		navigator.geolocation.getCurrentPosition((position) => {
			this.coordinates.longitude = position.coords.longitude;
			this.coordinates.latitude = position.coords.latitude;
		}, () => {
			alert('No available position.');
		}, {
			enableHighAccuracy: true,
			maximumAge: 30000,
			timeout: 27000,
		});

		//////////////
		// Firebase //
		//////////////
		///
		// get company details
		const urlSegments = window.location.pathname.split( '/' );

		database.ref('codeCompanyKeyMap/' + urlSegments[2]).once('value', (snapshot) => {
			this.companyKey = snapshot.val();

			if (!snapshot.val()) {
				this.switchToPage('error404');
			}

			// fetch company details
			database.ref('companies').child(this.companyKey).once('value', (companySnapshot) => {
				this.company = companySnapshot.val();
			});
		});
		
		// listen for changes in auth state
		firebase.auth().onAuthStateChanged((user) => {
		  if (user) {
		  	// console.log('nag auth state changed');
		    // User is signed in.
		    this.user = user;
		    // ...
		  } else {
		    // User is signed out.
		    this.user = {};
		  }
		});

		firebase.auth().getRedirectResult().then((result) => {
		  // The signed-in user info.
		  // https://majority-report-ca4ad.firebaseapp.com/__/auth/handler
		  // console.log('naguscceed');
		  this.user = result.user;
		}).catch((error) => {
			alert(error.message);
		  	console.log(error);
		  	// console.log('erroooor');
		});
	},

	methods: {
		switchToPage: function (page) {
			this.activePage = page;
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

		logout() {
			firebase.auth().signOut().then(() => {
			  	this.user = {};
			}).catch((error) => {
			  console.log(error);
			});
		},

		selectDefaultResponse(defaultResponse) {
			this.customMessage = defaultResponse.text;
		},

		submitReport() {
			const newReport = {
				coordinates: {
					longitude: this.coordinates.longitude, // ask Cris how
					latitude: this.coordinates.latitude, // ask Cris how
				},
				text: this.customMessage,
				is_translated: false,
				source: 'web',
				name: this.user.displayName,
				profile_photo: this.user.photoURL,
				entities_detected: false,
				created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
			};

			// add to DB
			database.ref('reports/' + this.companyKey).push(newReport);

			//window.location.replace('/');

			this.pushToast('Successfully reported the issue', 'success');

		},

		pushToast(message, toastClass) {
	        let $toastContent = $('<span>'+ message +'</span>');
	        Materialize.toast($toastContent, 3000, toastClass);
	    },
	}
});