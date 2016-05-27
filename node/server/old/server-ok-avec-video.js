/*
Serveur Elie pour la voiture - tout fonctionne a peu pres (sauf reco faciale)
pour utiliser:
sudo node server-ok-avec-video.js

DOIT avoir l'arduino connecté au RPI, avec firmata installé sur arduino
et CAMERA USB

Pour modifier la config de la camera faut aller dans lib/ et modifier socket.js , apps.js
ou autres



*/

// modules
var args = process.argv.slice(2);

var express = require('express')
  , http = require('http')
  , morgan = require('morgan');

var five = require("johnny-five")
, board, servo;
var board = new five.Board();
// configuration files
var configServer = require('./lib/config/server');
var cv = require('opencv');

// app parameters
var app = express();
var bodyParser = require('body-parser');
var ServoGauche;
var ServoDroit;
var distance;
var arduinoServos = {};
var controller = "GP2Y0A02YK0F";

var steeringServo = {
    pin: 6, 
    range: [0, 180], 
    type: "standard", 
    startAt: 75, 
    center: true, 
  };

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded()); // to support URL-encoded bodies
app.set('port', configServer.httpPort);
app.use(express.static(configServer.staticFolder));
app.use(morgan('dev'));

// serve index
require('./lib/routes').serveIndex(app, configServer.staticFolder);

// HTTP server
var server = http.createServer(app);
server.listen(app.get('port'), function () {
  console.log('HTTP server listening on port ' + app.get('port'));
});


// allow commands to be send via http call - GET only accepts command
app.get('/command/', function (req, res) {
  GestionCommandes (req.query.command);
  res.send('command: ' + req.query.command);
  
  // Eventually replace with json so commands can be sent back
  res.json({ 'state': serverStatus.currentAI });
});
// POST can look for timestamp(ms), command, and status
app.post('/command/', function (req, res) {
  GestionCommandes (req.body.command);
  
  updateRobotStatus (req.body.status);
});
// WebSocket server
var io = require('socket.io')(server);
io.on('connection', require('./lib/routes/socket'));
io.on('connection', function (socket) {
  console.log('A user has connected ');
  socket.emit('robot status', { data: 'server connected' });
  
  // Robot commands
  socket.on('robot command', function (data) {
    GestionCommandes (data.data);
  });
  module.exports.app = app;
  
  // Status update - gets forwarded to the webpage
  socket.on('robot update', function (data) {
    console.log('robot update!!!');
    var updatedData = data.data;
    updatedData['Time'] = new Date();
  	updatedData['Arduino Attached'] = serverStatus.hasArduino;
  
  	socket.broadcast.emit('robot status', { 'data': updatedData });
  });
  
  socket.on('disconnect', function(){
        console.log( socket.name + ' has disconnected from the chat.' + socket.id);
    });
});
// Broadcasts an update to the robot status

serverStatus = {
  hasArduino: true,
  hasCamera: true,
  currentAI: 'none',
};
//////////////////       DECLARATION DE LARDUINO ET DES SERVO ///////////////////

  //Gestion de la carte arduino et des elements hardwares
  board.on("ready", function() {
    
     arduinoServos = {
      steering: new five.Servo(steeringServo)
    };
    steering = arduinoServos.steering;
    ServoGauche = new five.Motor({
  pins: {
    pwm: 3,
    dir: 12,
    brake: 9
  }
});
ServoDroit = new five.Motor({
  pins: {
    pwm: 11,
    dir: 13,
    brake: 8
  }
});
	console.log("injection de la board");

    // INJECTION des elements dans la carte et le node.js
    board.repl.inject({
      ServoGauche: ServoGauche
    });
    board.repl.inject({
      ServoDroit: ServoDroit
    });
    
    board.repl.inject({
      s: arduinoServos
    });
    
   ServoGauche.forward(150);
    ServoDroit.forward(150);
	 board.wait(1000, function() {
    ServoGauche.brake();
    ServoDroit.brake();
  });
     	

  }); 
  

//////////////////       GESTION DES ORDRES DE DIRECTION A ARDUINO ///////////////////

//Indique la direction a prendre et la vitesse
//Utile pour les ROUES de la voiture
function Direction(direction,value) {
  
    console.log("MOTEUR-> valeur:"+value);

  if(direction=="forward") {
	console.log(direction);
  	ServoGauche.forward(150);
    ServoDroit.forward(150);
  	
  } else if(direction=="reverse") {
    	console.log(direction);

  	ServoGauche.reverse(150);
    ServoDroit.reverse(150);
  	
  } else if(direction=="left") {
    	console.log(direction);
  	ServoGauche.forward(200);
	ServoDroit.reverse(200);
    
  } else if(direction=="right") {
    	console.log(direction);
	ServoGauche.reverse(200);
  	ServoDroit.forward(200);
    
  } else if(direction=="stop") {
		board.wait(500, function() {
			ServoGauche.brake();
			ServoDroit.brake();
  		});
  }
  
  
}

//Sers a modifié la valeur d'un Servo tournant (pour la camera par ex)
function DirectionChange (direction,value) {
  console.log("SERVO->"+direction+" valeur:"+value);
   arduinoServos.steering.to(value);
   board.repl.inject({
      s: arduinoServos.steering
    });
}


function GestionCommandes (command) {
  //On separe les elements de la commande
  var parsedCommand = command.split("-");
  console.log('----- Command: -----');
  console.log(parsedCommand);
  
  // commands to johnny five
  // A bit convoluted here: commands are split between '-', with an arbitrary order for each section
  //LISTE DES COMMANDES: format:    direction - vitesse
  //stop
  //left
  //right
  //forward
  //reverse
  direction = parsedCommand[0];
  vitesse = parsedCommand[1];

  //Lancement de la commande
  if (direction!="servo" && direction!="recofaciale") {
    Direction(direction,vitesse);
    console.log('direction utilise');
  } else if (direction=="recofaciale") {
    RecoFaciale_python();
  } else if (direction=="servo"){
    DirectionChange(direction, vitesse);
    
  }

}

function RecoFaciale_python() {

	var PythonShell = require('python-shell');
	console.log('reco faciale lancement');
	var options = {
	  mode: 'text',
	  pythonOptions: ['-u'],
	  scriptPath: '/home/pi/projets/recofacial/face_recognizer',
	  args: ['-c', '/home/pi/projets/recofacial/images/elie/photo2.jpg']
	};
		
	var pyshell = new PythonShell('test_ok_double_sans_window.py', options);

	// sends a message to the Python script via stdin
	pyshell.send('hello');

	pyshell.on('message', function (message) {
	  // received a message sent from the Python script (a simple "print" statement)
	  console.log(message);
	//updateRobotStatus('test');

	});

	// end the input stream and allow the process to exit
	pyshell.end(function (err) {
	  if (err) throw err;
	  console.log('finished');
	});
}


function RecoFaciale() {
  
    camera.read(function(err, im) {
      if (err) throw err;
      image.save('recofaciale.png');
     });
    var COLOR = [0, 255, 0]; // default red
    var thickness = 2; // default 1
    
    cv.readImage('recofaciale.png', function(err, im) {
      if (err) throw err;
      if (im.width() < 1 || im.height() < 1) throw new Error('Image has no size');
    
      im.detectObject('./node_modules/opencv/data/haarcascade_frontalface_alt2.xml', {}, function(err, faces) {
        if (err) throw err;
    
        for (var i = 0; i < faces.length; i++) {
          face = faces[i];
          im.rectangle([face.x, face.y], [face.x + face.width, face.y + face.height], COLOR, 2);
        }
    
        im.save('./tmp/face-detection-rectangle.png');
        console.log('Image saved to ./tmp/face-detection-rectangle.png');
      });
    
    });
}
  

