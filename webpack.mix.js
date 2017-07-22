const { mix } = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js('js/users/main.js', 'public/js/users')
	.js('js/company/main.js', 'public/js/company')
   	.browserSync({
   		proxy: 'localhost:5000',
   	  	port: '8080',
   	  	files: [
   	  		'*',
   	  		'*/*',
   	  	],
   	});


		