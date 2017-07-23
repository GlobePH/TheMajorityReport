<template>
<div class="container">
	<div class="row">
		<div class="col l12" style="padding-top: 30px;">
			<h5>Set Twitter #Hashtag</h5>
			<input type="text" name="" class="form-control" v-model="innerCompanyHashtag" @keyup.enter="saveCompanyHastag"/>
		</div>
		<div class="col l12" style="margin-top: 30px;">
			<h5>Set Language</h5>
			<a class='dropdown-button btn w-100' href='#' data-activates='dropdown2'><span v-text="language && language != '' ? 'Your selected Language is '+ language.name : 'Please select a language'"></span></a>

  			<!-- Dropdown Structure -->
			<ul id='dropdown2' class='dropdown-content'>
				<li v-for="lang in languages"><a @click="selectAsLanguage(lang)" href="#!" v-text="lang.name"></a></li>
				<!-- <li><a href="#!">two</a></li> -->
			</ul>
			<!-- <input type="text" name="" class="form-control" v-model="language" /> -->
		</div>
	</div>
</div>
</template>
<script>
    export default {
        props: {
            companyKey: {
                type: String
            },
            companyHashtag: {
            	type: String
            },
			defaultResponse: {
				type: String
			},
			defaultReport: {
				type: String
			},
			defaultReportList: {
				type: Object
			},
			defaultResponseList: {
				type: Object
			},
			parentLanguage: {
				type: Object
			}
        },

        data () {
            return {
				language: '',
				languages: {},
            	innerCompanyHashtag: ''
            };
        },

        mounted() {
			// const GOOGLE_TRANSLATE_API_KEY = '';
			axios.get('/json/languages.json').then((response) => {
	            // this.languages = response.data.data.languages;
	            this.languages = Object.assign({},response.data);
	        }).catch((error) => {
	        	console.log(error);
	        });

			this.innerCompanyHashtag = this.companyHashtag;
			this.language =  this.parentLanguage;
			$('.dropdown-button').dropdown({
				inDuration: 300,
				outDuration: 225,
				constrainWidth: true, // Does not change width of dropdown to that of the activator
				belowOrigin: true, // Displays dropdown below the button
				alignment: 'left', // Displays dropdown with edge aligned to the left of button
		    });

			// alert(firebase.database().ref('companies/' + this.companyKey + '/language'));
			firebase.database().ref('companies/' + this.companyKey + '/language').on('value', (data) => {
				// this.language = data.val()[this.companyKey];
				this.language = data.val();
			});
			// socket.emit('get-languages');
			// socket.on('receive-languages', (languages) => {

			// 	this.languages = languages;
			// });
        },

        watch: {
        	companyHashtag() {
        		this.innerCompanyHashtag = this.companyHashtag;
        	}
        },

        methods: {
        	selectAsLanguage(lang){
        		this.language = lang;
        		this.saveCompanyLanguage();
        	},

		    saveCompanyHastag() {
		    	if (this.innerCompanyHashtag != '') {
			        firebase.database().ref('twitterHashtags/' + this.companyKey).set(this.innerCompanyHashtag, (test) => {
			        	this.$emit('setHashtag', this.innerCompanyHashtag);
			        	// alert('yes');
			        	this.pushToast('Successfully updated your hashtag', 'green');
			        });
			    }
		    },

		    saveCompanyLanguage() {
		        firebase.database().ref('companies/' + this.companyKey + '/language').set(this.language, (test) => {
		        	// this.$emit('setHashtag', this.innerCompanyHashtag);
		        	// alert('yes');
		        	this.pushToast('Successfully updated your language', 'green');
		        });
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
        },
    };
</script>