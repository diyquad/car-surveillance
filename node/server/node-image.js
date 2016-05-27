var express = require('express');
var app = express();

app.get('/', function (req, res) {
	var sys = require('sys');

    var exec = require('child_process').exec,
    child;

	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec('./IMG_0001.JPG &',puts);
	console.log("camera ok");
	
	
    
  res.send('Hello World!');
  res.send('Helffffds!');
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});