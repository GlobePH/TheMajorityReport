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

	socket.on('call', function (data) {
		io.emit('receive-call', data);
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