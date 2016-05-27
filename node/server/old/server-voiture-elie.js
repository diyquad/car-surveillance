/*** Robot Controller Script
 * application for controlling the RC car through a web browser
 * parts:
 * * express.js - serves webpage for direct robot management
 * * socket.io - streams information
 * * johnny-five - interacts with the Arduino, and the RC car by extension
 * run in conjunction with python opencv.py for AI commands
 *
 * Command line options:
 * * noArduino - skip all johnny-five content
*/

// Consider require('minimist') in the future
var args = process.argv.slice(2);

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var motorG;
var motorD;
var distance 
var controller = "GP2Y0A02YK0F";
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded()); // to support URL-encoded bodies

// noArduino is to be used when the Raspberry Pi isn't connected to an Arduino through serial
if (args.indexOf("noArduino") == -1) {
  var five = require("johnny-five")
    , board, servo;
  
  var arduinoServos = {};
  var throttleTimeout;
  var accelerationServo = {
    pin: 3,
    range: [0, 255],    // Default: 0-180
    type: "standard",   // Default: "standard". Use "continuous" for continuous rotation servos
    startAt: 0,          // if you would like the servo to immediately move to a degree
    center: false         // overrides startAt if true and moves the servo to the center of the range
  };
  
  
  var steeringServo = {
    pin: 6, 
    range: [0, 180], 
    type: "standard", 
    startAt: 75, 
    center: true, 
  };
  
}

// Robot constants 
//Valeur de vitesse des moteurs
stringValues = {
  //throttle
  'forward': 150,
  'reverse': 150,
  'stop': 0,
  'throttleTime': 1000,
  //steering
  'left': 50,
  'right': 50,
  'neutral': 0,
};
//Valeur du servo qui tourne
servoValues = {
  'left': 50,
  'right': 150,
  'neutral': 90,
};
serverStatus = {
  hasArduino: false,
  hasCamera: true,
  currentAI: 'none',
};

// Start server
http.listen(80, function(){
  console.log('Starting server, listening on *:80');
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// allow commands to be send via http call - GET only accepts command
app.get('/command/', function (req, res) {
  processRobotCommand (req.query.command);
  res.send('command: ' + req.query.command);
  
  // Eventually replace with json so commands can be sent back
  res.json({ 'state': serverStatus.currentAI });
});
// POST can look for timestamp(ms), command, and status
app.post('/command/', function (req, res) {
  processRobotCommand (req.body.command);
  
  updateRobotStatus (req.body.status);
});

io.on('connection', function (socket) {
  console.log('A user has connected ');
  socket.emit('robot status', { data: 'server connected' });
  
  // Robot commands
  socket.on('robot command', function (data) {
    processRobotCommand (data.data);
  });
  
  // Status update - gets forwarded to the webpage
  socket.on('robot update', function (data) {
    var updatedData = data.data;
    updateRobotStatus (updatedData);
  });
});

// Interprets and acts on a given command (expects strings split by "-")
function processRobotCommand (command) {
  var parsedCommand = command.split("-");
  console.log('----- Command: -----');
  console.log(parsedCommand);
  
  if (serverStatus.hasArduino) {
    // commands to johnny five
    // A bit convoluted here: commands are split between '-', with an arbitrary order for each section
    if (parsedCommand[0] == 'manual') {
      if (parsedCommand[1] == 'throttle') {
        if (parsedCommand.length < 4) {
          parsedCommand[3] = stringValues['throttleTime'];
        }
        if (parsedCommand[2] in stringValues) {
            steerChange(parsedCommand[2],stringValues[parsedCommand[2]]);
        }
        else {
           steerChange(parsedCommand[2],stringValues[parsedCommand[2]]);
        }
      }
      else if (parsedCommand[1] == 'turn') {
        if (parsedCommand[2] in stringValues) {
          steerChange(parsedCommand[2],stringValues[parsedCommand[2]]);
        }
        else {
          steerChange(parsedCommand[2],parseInt(parsedCommand[2]));
        }
      }
     else if (parsedCommand[1] == 'servo') {
        if (parsedCommand[2] in stringValues) {
          servoChange(parsedCommand[2],servoValues[parsedCommand[2]]);
        }
        else {
          servoChange(parsedCommand[2],parseInt(parsedCommand[2]));
        }
        serverStatus.currentAI = 'servo';
      }
    }
    // AI commands - to be forwarded to opencv
    else if (parsedCommand[0] == 'face') {
      console.log('facing');
      if (parsedCommand[1] == 'begin') {
        serverStatus.currentAI = 'face';
      }
      else {
        serverStatus.currentAI = 'none';
      }
    }
    else if (parsedCommand[0] == 'red') {
      if (parsedCommand[1] == 'begin') {
        serverStatus.currentAI = 'red';
      }
      else {
        serverStatus.currentAI = 'none';
      }
    }
    else {    // parsedCommand[0] = 'stop'
      steerChange(stringValues['neutral']);
      accelChange(stringValues['stop']);
    }
  }
}

// Broadcasts an update to the robot status
function updateRobotStatus (updatedData) {
  updatedData['Time'] = new Date();
  updatedData['Arduino Attached'] = serverStatus.hasArduino;
  
  socket.broadcast.emit('robot status', { 'data': updatedData });
}


// ----- Johnny Five -----
// These should only be called or accessed if "noArduino" is not an option

function steerChange (direction,value) {
console.log("MOTEUR->"+direction+" valeur:"+value);

  if(direction=="forward") {
  	motorD.reverse(value);
  	motorG.forward(value);
  	
  } else if(direction=="reverse") {
  	motorD.forward(value);
  motorG.reverse(value);
  	
  } else if(direction=="left") {
   	motorG.forward(0);
  	motorD.reverse(value);
  } else if(direction=="right") {
    motorG.forward(value);
  	motorD.forward(0);
  } else if(direction=="stop") {
    //motorG.brake();
  	//motorD.brake();
  }
  board.wait(1000, function() {
      motorG.brake();
      motorD.brake();
    });
}
function servoChange (direction,value) {
console.log("SERVO->"+direction+" valeur:"+value);
 arduinoServos.steering.to(value);
  accelChange();
  	board.repl.inject({
    	s: arduinoServos
  	});
}


function accelChange () {
	console.log("cm: ", distance.centimeters, distance.raw);
}



if (args.indexOf("noArduino") == -1) {
  board = new five.Board();

  board.on("ready", function() {
    arduinoServos = {
      acceleration: new five.Servo(accelerationServo),
      steering: new five.Servo(steeringServo)
    };
    acceleration = arduinoServos.acceleration;
    steering = arduinoServos.steering;
      /*
    Arduino Motor Shield R3
      Motor A
        pwm: 3
        dir: 12
        brake: 9

      Motor B
        pwm: 11
        dir: 13
        brake: 8

   */
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
  
   distance = new five.IR.Distance({
    controller: controller,
    pin: "A1",
    freq: 500
  });
    // Inject the `servo` hardware into
    // the Repl instance's context;
    // allows direct command line access
    board.repl.inject({
      s: arduinoServos
    });
    board.repl.inject({
      motorG: motorG
    });
    board.repl.inject({
      motorD: motorD
    });
  distance.on("data", function() {
    if (controller) {
      console.log("inches: ", this.inches);
      console.log("cm: ", this.centimeters, this.raw);
    } else {
      console.log("value: ", this.value);
    }
  });

    serverStatus.hasArduino = true;
  });
  
  	
}
