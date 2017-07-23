require('./bootstrap');
require('./components');

const database = firebase.database();

new Vue({
	
	el: '#app',

	data: {
		activePage: 'company',
		companies: {},
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
	},

	methods: {
		setCompany: function (data) {
			this.$set(this.companies, data.key, data.val());
		},

		switchToPage: function (page) {
			this.activePage = page;
		},
	},

});