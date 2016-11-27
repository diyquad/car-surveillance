/**
 * Created by Elie on 16/07/2015.
 */

// modules
var express = require('express')
  , http = require('http')
  , morgan = require('morgan');
 var _mysql = require('mysql');

// configuration files
var configServer = require('./lib/config/server');

// app parameters
var app = express();
app.set('port', configServer.httpPort);
app.use(express.static(configServer.staticFolder));
app.use(morgan('dev'));

require('./lib/routes').serveIndex(app, configServer.staticFolder);

// HTTP server
var server = http.createServer(app);
server.listen(app.get('port'), function () {
  		console.log('Serveur: HTTP server listening on port ' + app.get('port'));
	});

	  
var io = require('socket.io')(server);
module.exports.app = app;
io.on('connection', function (socket) {
	console.log('Serveur: A user has connected ');
	
	socket.emit('robot status', { data: 'server connected' });
		
	socket.on('mysql', function (data) {
			addmysql();
	});
  	
}); //Fin io.on

//Generation d'un entier aleatoir
function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

function addmysql() {
	
	var HOST = 'localhost';
	var PORT = 3306;
	var MYSQL_USER = 'root';
	var MYSQL_PASS = 'clic2clic';
	var DATABASE = 'rpi';
	var TABLE = 'sensor';
	var random=randomInt(0,100);
	var mysql = _mysql.createConnection({
	    host: HOST,
	    port: PORT,
	    user: MYSQL_USER,
	    password: MYSQL_PASS,
	});

	mysql.query('use ' + DATABASE);

	mysql.query('INSERT INTO '+TABLE+' (data) VALUES ("'+random+'")');
	}