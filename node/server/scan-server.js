var five = require("johnny-five"),
  board;

board = new five.Board();

board.on("ready", function() {
  var center, collision, degrees, step, facing,
    range, redirect, look, isScanning, scanner, sonar, motors,configs, motor1,motor2,motor3,motor4, displayMessage;

  // Collision distance (inches)
  collision = 6;

  // Starting scanner scanning position (degrees)
  degrees = 90;

  // Servo scanning steps (degrees)
  step = 10;

  // Current facing direction
  facing = "";

  // Scanning range (degrees)
  range = [50, 170];

  // Servo center point (degrees)
  center = range[1] / 2;
  //display message of cillision
  displayMessage = true;
  // Redirection map
  redirect = {
    left: "right",
    right: "left"
  };

  // Direction to look after releasing scanner lock (degrees)
  look = {
    forward: center,
    left: 130,
    right: 40
  };

  // Scanning state
  isScanning = true;

  // Sonar instance (distance detection)
  sonar = new five.Proximity({
		controller: "HCSR04",
		pin: 9
});
  // Servo instance (panning)
  scanner = new five.Servo({
    pin: 10,
    range: range
  });

   configs = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V1;

	 motor1 = new five.Motor(configs.M1);
	
	 motor2 = new five.Motor(configs.M2);
	motor3 = new five.Motor(configs.M3);
	motor4 = new five.Motor(configs.M4);

  // Initialize the scanner at it's center point
  // Will be exactly half way between the range's
  // lower and upper bound
  scanner.center();

  
  // Scanner/Panning loop
  this.loop(100, function() {
    var bounds;
	
    bounds = {
      left: center + 20,
      right: center - 20
    };

    // During course change, scanning is paused to avoid
    // overeager redirect instructions[1]
    if (isScanning) {
      // Calculate the next step position
      if (degrees >= scanner.range[1] || degrees === scanner.range[0]) {
        step *= -1;
      }

      // Update the position in degrees
      degrees += step;

      // The following three conditions will help determine
      // which way the bot should turn if a potential collision
      // may occur in the sonar "change" event handler[2]
      if (degrees > bounds.left) {
        facing = "gauche";
      }

      if (degrees < bounds.right) {
        facing = "droite";
      }

      if (degrees > bounds.right && degrees < bounds.left) {
        facing = "avancer";
      }

      scanner.to(degrees);
    }
  });

  // [2] Sonar "change" events are emitted when the value of a
  // distance reading has changed since the previous reading
  //
  sonar.on("change", function() {
    var turnTo;

    // Detect collision
    if (Math.abs(this.cm) < collision && isScanning) {
      // Scanning lock will prevent multiple collision detections
      // of the same obstacle
      isScanning = false;
      turnTo = redirect[facing] || Object.keys(redirect)[Date.now() % 2];
	
      // Log collision detection to REPL
	  	console.log(
	        [Date.now(),
	          "Collision detected " + this.cm + " cm away.",
	          "Turning " + turnTo.toUpperCase() + " to avoid"
	        ].join("\n")
	      );  

      // Override the next scan position (degrees)
      // degrees = look[ turnTo ];

      // [1] Allow 1000ms to pass and release the scanning lock
      // by setting isScanning state to true.
      board.wait(1500, function() {
        console.log("Release Scanner Lock");
        isScanning = true;
      });
    }
  });
});

function voitureManuel(direction) {
	if(direction == 'reculer') {
		motor1.forward(255);
		motor3.forward(255);
		motor2.forward(255);
		motor4.forward(255);
	} else if(direction == 'avancer') {
		motor1.reverse(255);
		motor3.reverse(255);
		motor2.reverse(255);
		motor4.reverse(255);
	} else if(direction == 'gauche') {
		motor1.reverse(255);
		motor3.reverse(255);
		motor2.reverse(255);
		motor4.reverse(255);
	} else if(direction == 'droite') {
		motor1.reverse(255);
		motor3.reverse(255);
		motor2.reverse(255);
		motor4.reverse(255);
	} else {
		motor1.stop();
		motor3.stop();
		motor2.stop();
		motor4.stop();
	}
	board.wait(2000, function() {
		motor1.stop();
		motor3.stop();
		motor2.stop();
		motor4.stop();
	});
}

// Reference
//
// http://www.maxbotix.com/pictures/articles/012_Diagram_690X480.jpg