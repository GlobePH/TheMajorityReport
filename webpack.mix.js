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

mix.js('js/users/home.js', 'public/users/js')
   .js('js/users/report.js', 'public/users/js')
   .js('js/admin/admin.js', 'public/admin/js')
	.js('js/company/main.js', 'public/company/js')
   .sass('css/users/main.scss', 'public/users/css')
   .sass('css/company/main.scss', 'public/company/css')
   	.browserSync({
   		proxy: 'localhost:5001',
   	  	port: '8080',
   	  	files: [
   	  		'*',
   	  		'*/*',
   	  	],
   	});


		