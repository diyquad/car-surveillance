/**
 * Created by Elie on 16/07/2015.
 */

// modules
var express = require('express')
  , http = require('http')
  , morgan = require('morgan');

//Communication Python Node Shell
var PythonShell = require('python-shell');

//Communication Raspberry-Arduino via SerialPort
var com = require("serialport");
var texte=""; // texte recu via le buffer de se
var serialPort = "";

// configuration files
var configServer = require('./lib/config/server');
var imagerecofaciale="";
var url="";
var myurl="";

var angle=75; //angle du servo radar
// app parameters
var app = express();
app.set('port', configServer.httpPort);
app.use(express.static(configServer.staticFolder));
app.use(morgan('dev'));
 var five = require("johnny-five")
    , board, servo;
  
  var arduinoServos = {};    
  
  var steeringServo = {
    pin: 6, 
    range: [30, 180], 
    type: "standard", 
    startAt: 75, 
    center: true, 
  };
  


// server index - //Declaration des chemins d'acces

require('./lib/routes').serveIndex(app, configServer.staticFolder);

// HTTP server
var server = http.createServer(app);
server.listen(app.get('port'), function () {
  console.log('Serveur: HTTP server listening on port ' + app.get('port'));
});



// Robot constants 
 board = new five.Board();
   console.log('Serveur: A user has connected ');
    board.on("ready", function() {
	  var proximity = new five.Proximity({
	    controller: "HCSR04",
	    pin: 4
	  });
	    arduinoServos = {
	      steering: new five.Servo(steeringServo)
	    };
	    steering = arduinoServos.steering;
	         
		motorG = new five.Motor({
			pins: {
			pwm: 3,
			dir: 12,
			brake: 9
		}
	  });
		motorD= new five.Motor({
			pins: {
			pwm: 11,
			dir: 13,
			brake: 8
		}
	  });
	  
	  
		var io = require('socket.io')(server);
//io.on('connection', require('./lib/routes/socket'));
//////////////////////////////////////////////////////////
//Centre de reception des messages après la connexion
//////////////////////////////////////////////////////////
io.on('connection', function (socket) {
	
 

    socket.emit('robot status', { data: 'server connected' });


    socket.on('robot command', function (data) {
        //GestionCommandes (data.data);
    });

    socket.on('recofaciale', function () {
        console.log('Serveur: Demande de reco faciale');
        Prendre_Photo(socket);
    });
    
    socket.on('camera', function () {
        console.log('Serveur: Lancement webcam');
        lancer_camera(socket);
    });
    
    socket.on('camera-off', function () {
        console.log('Serveur: Arret webcam');
        arret_camera(socket);
    });
	
	socket.on('record-on', function () {
        console.log('Serveur: Lancement record video');
        recordvideo(socket);
    });


    
    socket.on('disconnect', function(){
        console.log( socket.name + ' has disconnected from the chat.' + socket.id);
        
    });
    
    socket.on('avancer', function (data) {
    	steerChange('forward',255);
  	});
  	socket.on('reculer', function (data) {
    	steerChange('reverse',255);
  	});
  	socket.on('gauche', function (data) {
    	steerChange('left',255);
  	});
  	socket.on('droite', function (data) {
    	steerChange('right',255);
  	});
  	socket.on('stop', function (data) {
    	//steerChange('stop',255);
  	});
  	
  	socket.on('radar-gauche', function (data) {
    	servoChange('gauche');
  	});
  	socket.on('radar-droite', function (data) {
    	servoChange('droite');
  	});
  	socket.on('radar-center', function (data) {
    	servoChange('center');
  	});
  	socket.on('radar-sweep', function (data) {
    	servoChange('sweep');
  	});
  	
  	socket.on('radar-boucle', function (data) {
	  	BoucleRadar(socket, proximity);	
	});
	socket.on('autonomous', function (data) {
    	autonomous(socket,proximity);
  	})
  	
}); //Fin io.on
  	
	});
// WebSocket server


module.exports.app = app;

function steerChange (direction,value) {
	console.log("MOTEUR->"+direction+" valeur:"+value);
	
	var time = 500;  //Durée du mouvement 
	if(direction=="reverse") {
		motorD.reverse(value);
		motorG.reverse(value);
		
	} else if(direction=="forward") {
		motorD.forward(value);
		motorG.forward(value);
		
	} else if(direction=="left") {
		motorG.forward(value);
		motorD.reverse(0);
	} else if(direction=="right") {
	motorG.forward(0);
		motorD.forward(value);
		time = 100;
	} else if(direction=="stop") {
		motorG.brake();
		motorD.brake();
		time = 100;
	}
	board.wait(1000, function() {
	  motorG.brake();
	  motorD.brake();
	});
}
function servoChange (direction) {
	arduinoServos.steering.stop();
	console.log("SERVO->"+direction);
	if(direction=='droite') {
		arduinoServos.steering.to(20);
	}else if(direction=='gauche') {
		arduinoServos.steering.max();
	}else if(direction=='center') {
		arduinoServos.steering.center();
	}else if(direction=='sweep') {
		arduinoServos.steering.sweep();
	}
	//arduinoServos.steering.to(value);
	//servo.min();
  	/*board.repl.inject({
    	s: arduinoServos
  	});*/
}


//////////////////////////////////////////////////////////
//FONCTIONS POUR LA RECONNAISSANCE FACIALE
//////////////////////////////////////////////////////////
function Prendre_Photo(socket) {
    image="";
    folder="";
    image_url="";

	console.log('Serveur: --> JS: Demande de prise de photo');
	//Options pour lancer le script Py
    var options = {
	  mode: 'text',
	  pythonOptions: ['-u'],
	  scriptPath: '/home/pi/projects/robots/car-surveillance/py'
	};

		var pyshell = new PythonShell('snapshot.py', options);
        // sends a message to the Python script via stdin
        //pyshell.send('hello');
		pyshell.on('message', function (message) {
		  // received a message sent from the Python script (a simple "print" statement)
		  console.log(message);
          if(stringContains(message,'image*') ) {
            var res = message.split("*");
            image = res[1];
            console.log("serveur: imagerecofaciale:"+image);

          } else if(stringContains(message,'folder*') ) {
            var res = message.split("*");
            folder = res[1];
            console.log("serveur: URL:"+folder);
          } else if(stringContains(message,'image_url*') ) {
              var res = message.split("*");
              image_url = res[1];
              console.log("serveur: URL:" + image_url);
          }
		});

		// end the input stream and allow the process to exit
		pyshell.end(function (err) {
            console.log('--> JS: Fin de la prise de la photo ');
            console.log('--> JS: Liste variable');
            console.log("image"+image);
            console.log("folder"+folder);
            console.log("image url"+image_url);
            socket.emit('fin', { data: { title:'photo' ,data: image_url } });
            console.log('--> JS: Lancement Detection_visage ');
            Detection_Visage(image_url, socket);
		});
}

function Detection_Visage(image_url,socket) {
    var nbrevisage="";
    var image_name_rectangle="";
    var crop="person-icon.png";

	console.log('--> JS: Demande Detection Visage');
	var options = {
	  mode: 'text',
	  pythonOptions: ['-u'],
	  scriptPath: '/home/pi/projects/robots/car-surveillance/py',
      args: [image_url]
	};
	console.log(options);

		var pyshell = new PythonShell('detect-faces.py', options);
        // sends a message to the Python script via stdin
        //pyshell.send('hello');
		pyshell.on('message', function (message) {
		  // received a message sent from the Python script (a simple "print" statement)
		    console.log('message:'+message);
            if(stringContains(message,'- faces') ) {
                var res = message.split("-");
                nbrevisage = res[1];
                console.log("serveur:"+nbrevisage+" visages detectés:");
            } else if(stringContains(message,'image_name_rectangle*') ) {
                var res = message.split("*");
                image_name_rectangle = res[1];
                console.log("serveur: image rectangle:"+image_name_rectangle);
            } else if(stringContains(message,'crop*') ) {
                var res = message.split("*");
                crop = res[1];
                console.log("serveur: image crop:"+crop);
            } else if(stringContains(message,'image*') ) {
                var res = message.split("*");
                imagepath = res[1];
                console.log("serveur: image path final:"+imagepath);
            }
            


		});

		// end the input stream and allow the process to exit
		pyshell.end(function (err) {
            console.log('--> JS: Fin de la detection de visage');
            socket.emit('fin', { data: { title:'reco' ,data: imagepath, crop: '/recofaciale/'+crop } });
            socket.emit('update', { data: { title:'Reconnaissance faciale' ,data: nbrevisage } });
            console.log('--> JS: Fin socket fin emit detection');
		});

}


//////////////////////////////////////////////////////////
//FONCTIONS POUR LA WEBCAM
//////////////////////////////////////////////////////////
function lancer_camera(socket) {
	console.log("lancer camera");
	var sys = require('sys');
	var exec = require('child_process').exec;
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec('/home/pi/projects/libraries/mjpg-streamer/mjpg_streamer -i "/usr/local/lib/input_uvc.so -f 25 -r 320x240" -o "/usr/local/lib/output_http.so -w /usr/local/lib/www" &',puts);
	console.log("camera ok");
	socket.emit('camera_on');
	
}

function arret_camera() {
	console.log("stoper camera");
	var sys = require('sys');
	var exec = require('child_process').exec;
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec('kill $(pgrep mjpg_streamer) > /dev/null 2>&1',puts);
	
	
}


function videofacerec(socket) {
	console.log("video facerec");
	var options = {
	  mode: 'text',
	  pythonOptions: ['-u'],
	  scriptPath: '/home/pi/projects/robots/py-divers',
      args: ['-t', '/home/pi/projects/robots/images/dataset/','modele1.pkl']
	};
	console.log(options);
	//var pyshell = new PythonShell('simple_videofacerec.py', options);
	
	PythonShell.run('open-window.py', options, function (err, results) {
	  if (err) throw err;
	  // results is an array consisting of messages collected during execution 
	  console.log('results: %j', results);
	});


	/*PythonShell.on('message', function (message) {
		// received a message sent from the Python script (a simple "print" statement)
		console.log('message:'+message);
	});
	// end the input stream and allow the process to exit
	PythonShell.end(function (err) {
        console.log('--> Fin video facerec');
	});*/
}

function recordvideo(socket) {
	console.log("record video");
	var sys = require('sys');
	var exec = require('child_process').exec;
	var aleatoire = randomInt(1,5000);
	var videofile = 'videos/video_'+ aleatoire +'.mkv';
	var videofilecp = 'videos/video_'+ aleatoire +'_1.mp4';
	var videopath = '../client/'+videofile;
	var videopathcp = '../client/'+videofilecp;
	//ffmpeg -i input.wmv -vcodec mpeg4 -r 30 -b:v 2000000 -acodec limp3lame -ab 126000 -ar 44100 -ac 2 -s 1280x720 output.mp4 -y 2> /dev/null &
	exec('ffmpeg -i http://192.168.0.44:8080/?action=stream -t 1 '+ videopath +' &',function (err, results) {
	  if (err) throw err;
	  // results is an array consisting of messages collected during execution 
	  console.log('Fin du record video - %j', results);
	  //socket.emit('video-play', videofile);
	  console.log('ffmpeg -i '+videopath+' -vcodec libx264 '+ videopathcp)
	  exec('ffmpeg -y -i '+videopath+' -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -c:a libvo_aacenc -b:a 128k  '+ videopathcp +' &',function (err, results) {
		  if (err) throw err;
		  // results is an array consisting of messages collected during execution 
		  console.log('Fin de copie - %j', results);
		  socket.emit('video-play', { mp4: videofile, webm: videofilecp });
		  socket.emit('record-off', { mp4: videofile, webm: videofilecp });
		});
	});
}

function stringContains(inputString, stringToFind) {
    return (inputString.indexOf(stringToFind) != -1);
}

//CGeneration d'un entier aleatoir
function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

//////////////////////////////////////////////////////////
//FONCTIONS POUR LE RADAR
//////////////////////////////////////////////////////////

/*function BoucleRadar(socket,proximity) {
	var animation = new five.Animation(arduinoServos.steering);

  // Create an animation object
	 animation.enqueue({
	    duration: 500,
	    cuePoints: [0,1],
	    keyFrames: [ {degrees: 40},{degrees: 50}],
		onstop: console.log('pause')
	  });
	  	animation.play();

}*/

function BoucleRadar(socket, proximity) {
	var posG = 40;
	var posC = 90;
	var posD = 180;
	var coordonnes=[];
	
	//On scan a gauche
	arduinoServos.steering.to(posG,200);
	arduinoServos.steering.on('move:complete',function() {
		coordonnes[0] = posG;
		coordonnes[1] = proximity.cm;		
	});
	setTimeout(function() {
	//On scan au centre
		arduinoServos.steering.to(posC,200);
		arduinoServos.steering.on('move:complete',function() {
			coordonnes[2] = posC;
			coordonnes[3] = proximity.cm;			
		});
		setTimeout(function() {
			arduinoServos.steering.to(posD,200);
			arduinoServos.steering.on('move:complete',function() {
				coordonnes[4] = posD;
				coordonnes[5] = proximity.cm;
				arduinoServos.steering.to(posC,1000);
				socket.emit('coordonnes',coordonnes);
				console.log(coordonnes);
			});
		},1000);
	}, 1000);
}

function RadarCallback(options,callback) {
	callback(options);
}


function autonomous(socket, proximity) {
	console.log('Debut autonomous');
	var coordonnes= RadarCallback([socket,proximity], function() {
       		 BoucleRadar(socket,proximity);
        });
	
	console.log('Fin coordonnes :'+coordonnes);
	var cote;
	dGauche=coordonnes[1];
	dCentre = coordonnes[3];
	dDroite = coordonnes[5];
	coordonnes = [coordonnes[1],coordonnes[3],coordonnes[5]];
	maxDistance = Math.max.apply(null,coordonnes);
	cote = coordonnes.indexOf(maxDistance);
	if(cote ==  0) {
		console.log('Direction Gauche');
		steerChange('left',255);
	} else if(cote ==  1) {
		console.log('Direction Avant');
		steerChange('forward',255);
	}else if(cote ==  2) {
		console.log('Direction Droite');
		steerChange('right',255);
	}
	
	board.wait(1000, function() {
      motorG.brake();
      motorD.brake();
    });
}


function addmysql() {
var _mysql = require('mysql');

var HOST = 'localhost';
var PORT = 3306;
var MYSQL_USER = 'root';
var MYSQL_PASS = 'clic2clic';
var DATABASE = 'rpi';
var TABLE = 'sensor';
var random=Math.random() * (100 - 0) + 0;
var mysql = _mysql.createConnection({
    host: HOST,
    port: PORT,
    user: MYSQL_USER,
    password: MYSQL_PASS,
});

mysql.query('use ' + DATABASE);

  mysql.query('INSERT INTO '+TABLE+' (data) VALUES ("'+random+'")');
 
  	/*serialport.on('open', function(){ 
	  serialport.on('data', function(data){   
    console.log(''+data); 
   
 
   
	});*/


}); 
	
}