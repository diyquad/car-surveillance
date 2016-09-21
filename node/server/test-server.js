var five = require("johnny-five");
var board = new five.Board();
var flag=0;
 var motor1
 var motor2;
 var motor3;
 var motor4;
 var proximity;
 var servo;
 var previousDistance = 0;
 var currentDistance= 0;
 var i=0;
 var pinproximity;
board.on("ready", function() {
 
	var configs = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V1;

	 motor1 = new five.Motor(configs.M1);
	
	 motor2 = new five.Motor(configs.M2);
	motor3 = new five.Motor(configs.M3);
	motor4 = new five.Motor(configs.M4);
		
	servo = new five.Servo({
		pin: 10, 
		range: [30, 180], 
		type: "standard", 
		startAt: 75, 
		center: true, 
	});
	proximity = new five.Proximity({
		controller: "HCSR04",
		pin: 9
	});
	pinproximity = new five.Pin(9);
	pinproximity.low();
	console.log('ok low');
	proximity.on('change',function() {
		console.log('change' +this.cm);
		currentDistance = this.cm
		if(currentDistance>(1.3*previousDistance) || currentDistance<(1.3*previousDistance)) {
			previousDistance = currentDistance
			console.log('i: '+i+' -->'+this.cm);
			i+=1;
		}
		//console.log(this.cm);
	})
	//voiture('avancer');
	var i=0;
	testcallback(BoucleRadar, function() {
		console.log('ok');
	});
	console.log('fin');
	console.log(proximity.cm);
	
		
	
	
});
function testcallback(callback) {
		 callback();
}
function BoucleRadar() {
	var posG = 40;
	var posC = 90;
	var posD = 150;
	var coordonnes=[];
	
	//On scan a gauche
	servo.to(posG,200);
	
	setTimeout(function() {
		coordonnes[0] = posG;
		//coordonnes[1] = proximity.cm;	
	//On scan au centre
		servo.to(posD,300);
	
			
		setTimeout(function() {
			coordonnes[2] = posD;
		//	coordonnes[3] = proximity.cm;
			servo.to(posC,100);
			setTimeout(function() {
				coordonnes[4] = posC;
		//		coordonnes[5] = proximity.cm;
				//socket.emit('coordonnes',coordonnes);
				console.log(coordonnes);
				return true;
			},500);	
		},1000);
	}, 1000);
}

function voiture(direction) {
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


