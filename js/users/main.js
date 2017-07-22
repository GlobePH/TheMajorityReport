require('./bootstrap');
require('./components');

new Vue({
	el: '#app',

	data: {
		activePage: 'login',
		baseCountry: '',
		errors: {},
		name: '',
		talkingTo: '',
		targetCountry: '',
		product: '',
	},

	methods: {
		switchToPage(page) {
			this.activePage = page;
			this.clearErrors();
		},

		clearErrors() {
			this.errors = {};
		},

		call(user) {
			this.activePage = 'call';
			this.$nextTick(() => {
				this.talkingTo = user;
				socket.emit('call', {
					to: user,
					from: this.name,
				});
			});
		},

		attemptSwitchToPage(page) {
			if (this.activePage == 'baseCountry') {
				if (!this.baseCountry) {
					this.$set(this.errors, 'baseCountry', 'Please select a base country');
				} else {
					this.switchToPage(page);
				}
			} else if (this.activePage == 'productTargetCountry') {
				if (!this.targetCountry || !this.product) {
					this.$set(this.errors, 'targetCountry', 'Please select a target country');
					this.$set(this.errors, 'product', 'Please enter the type of product you plan to enter into the market');
				} else {
					this.switchToPage(page);
				}
			}
		},

		changeTargetCountry(newValue) {
			this.targetCountry = newValue;
		},

		changeProduct(newValue) {
			this.product = newValue;
		},
	},
})