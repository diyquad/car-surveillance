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
// app parameters
var app = express();
app.set('port', configServer.httpPort);
app.use(express.static(configServer.staticFolder));
app.use(morgan('dev'));

// server index - //Declaration des chemins d'acces

require('./lib/routes').serveIndex(app, configServer.staticFolder);

// HTTP server
var server = http.createServer(app);
server.listen(app.get('port'), function () {
  console.log('Serveur: HTTP server listening on port ' + app.get('port'));
});



// WebSocket server
var io = require('socket.io')(server);
//io.on('connection', require('./lib/routes/socket'));
//////////////////////////////////////////////////////////
//Centre de reception des messages après la connexion
//////////////////////////////////////////////////////////
io.on('connection', function (socket) {

    console.log('Serveur: A user has connected ');
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
    socket.on('radar', function (data) {
        console.log('Serveur: Utilisation du radar');
        //On ecoute le port Serial pour recevoir les data
        serialPort = new com.SerialPort("/dev/ttyACM0", {
            baudrate: 9600
        });
        //
        serialPort.on('open',function() {
            console.log('Port open');
            serialPort.flush(function(err,results){});
        });

        serialPort.on('data', function(data) {
            texte += data.toString();
            if(stringContains(texte,']')) {
                io.sockets.emit('radar-coordonnes', texte);
                console.log("->"+texte+"<-");
                texte="";
            }
        });
    });

    socket.on('radar-stop', function (data) {
        console.log('Serveur: Utilisation du radar');
        serialPort.write("coucou", function(err, results) {
            console.log('err ' + err);
            console.log('results ' + results);
        });
        serialPort.close();
    });

    socket.on('disconnect', function(){
        console.log( socket.name + ' has disconnected from the chat.' + socket.id);
        
    });

}); //Fin io.on

module.exports.app = app;


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
	exec('ffmpeg -i http://192.168.0.26:8080/?action=stream -t 1 '+ videopath +' &',function (err, results) {
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

function connectionArduino(socket){
    var i=0; // distance
    var j=0; // angle
    var z=0;
    var tab=[[107.99,60],[543.04,45],[107.95,30],[543.04,15],
[543.04,0],[41.58,180],[44.33,165],[107.45,75],[107.99,60],
[543.04,45],[107.95,30],[543.04,15],[543.04,0],[41.58,180],
[44.33,165],[45.47,179],[29.36,164],[45.32,149],[45.65,134],
[30.08,119],[25.70,104],[24.91,89],[30.08,74],[45.14,59],[46.99,44],
[47.88,29],[194.11,14],[396.15,180],[25.90,165],[26.39,150],[26.99,135],
[21.09,120],[20.47,105],[20.69,90],[26.95,75],[25.76,60],[26.23,45],
[26.66,30],[25.18,15],[2.77,0],[2.52,180],[51.60,165],[27.98,150]];
    for(z=0;z<40;z++) {
        i= tab[z][0];
        j= tab[z][1];
            //Math.floor(Math.random() * (180 - 1) + 1);
           // setTimeout(function() { }, 500);
         socket.emit('radar-coordonnes', [i, j]);
                console.log(z + "-->[d:" + i + ",r:" + j + "]");


    }


}

