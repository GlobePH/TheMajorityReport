require('./bootstrap');
require('./components');

const database = firebase.database();

new Vue({
	
	el: '#app',

	data: {
		activePage: 'login',
		company: {
			key: '',
			name: '',
			logo: '',
			code: '',
		},
		user: {},
		companies: {},
	},

	watch: {
		user(newValue) {
			if (newValue && Object.keys(newValue).length > 0) {
				this.activePage = 'admin';
			} else {
				this.activePage = 'login';
			}
		},
	},

	mounted() {
		$('.modal').modal();

		// fetch all companies, and listen for changes
		const companiesDbRef = database.ref('companies');
		companiesDbRef.on('child_added', this.setCompany);
		companiesDbRef.on('child_changed', this.setCompany);
		companiesDbRef.on('child_removed', (data) => {
			this.$delete(this.companies, data.key);
		});

		// listen for changes in auth state
		firebase.auth().onAuthStateChanged((user) => {
		  if (user) {
		    this.user = user;
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

		switchToPage: function (page) {
			this.activePage = page;
		},

		setCompany: function (data) {
			this.$set(this.companies, data.key, data.val());
		},

		editCompany: function (c, key) {
			this.switchToPage('form');
			c.key = key;
			this.company = c;
		},

		syncToDb() {
			if (this.company.key) {
				// update the firebase DB
				database.ref('companies/' + this.company.key).set(this.company);
				database.ref('codeCompanyKeyMap/' + this.company.code).set(this.company.key);
			} else {
				const newCompany = this.company;
				delete newCompany.key;
				// add to firebase DB
				const newCompanyKey = database.ref('companies').push(newCompany).key;
				database.ref('codeCompanyKeyMap/' + this.company.code).set(newCompanyKey);
			}

			// empty the form again
			this.company = {
				key: '',
				name: '',
				logo: '',
				code: '',
			},

			// go back to admin
			this.switchToPage('admin');
		},

		deleteCompany(c, key) {
			database.ref('codeCompanyKeyMap/' + c.code).remove();
			database.ref('companies/' + key).remove();
		},

		logout() {
			firebase.auth().signOut().then(() => {
			  	this.user = {};
			}).catch((error) => {
			  console.log(error);
			});
		},
	},

});