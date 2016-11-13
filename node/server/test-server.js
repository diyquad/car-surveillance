var async = require("async");
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

	var i=0;
	
	
	proximity.on('data',function() {
		currentDistance = this.cm;
	});
	BoucleRadar('autonomous');
});
function testcallback(callback) {
		 callback();
}
function mesureDistance() {
	proximity.on('data',function() {
		currentDistance = this.cm
	});
	console.log('distance:'+currentDistance);
	
}

/*
	
Fonction qui declenche la boucle de scan radar	
*/
function BoucleRadar(type) {
	var posG = 55;
	var posC = 90;
	var posD = 125;
	var coordonnes=[];
	
	//On scan a gauche
	servo.to(posG,200);
	setTimeout(function() {  //on laisse le temps au cerveau d'y aller
		coordonnes[0] = posG;
		coordonnes[1] = proximity.cm;
			
		//On scan au centre
		servo.to(posD,300);
		setTimeout(function() {
			coordonnes[2] = posD;
			coordonnes[3] = proximity.cm;
			servo.to(posC,100);
			setTimeout(function() {
				coordonnes[4] = posC;
				coordonnes[5] = proximity.cm;
				//socket.emit('coordonnes',coordonnes);
				console.log(coordonnes);
				if(type=='autonomous') {
					dirigerVoiture(coordonnes);
				}
				return coordonnes;
			},500);	
		},1000);
	}, 1000);
}

/*
Fonction qui dirige la voiture, en fonction de coordonnées recus par le scan radar	
*/
function dirigerVoiture(coordonnes) {
	//On recupere les 3 coordonnées des distances
	var distance = [coordonnes[1],coordonnes[3],coordonnes[5]];
	//On cherche la distance la plus loin
	var maxd = Math.max.apply(Math,distance);
	//On cherche a quoi elle correspond (gauche, droite, centre)
	var pos = distance.indexOf(maxd);
	//Si la distance est >20cm
	if(maxd>20) { 
		switch(pos) {
		    case 0: //Distance droite la plus loin
		        console.log('droite');
		        voiture('droite');
		        break;
		    case 1://Distance gauche la plus loin
		        console.log('gauche');
		        voiture('droite');
		        break;
		    case 2://Distance centre la plus loin
		        console.log('centre');
		        voiture('avancer');
		        break;
		    default://On sait pas, on recule
		        console.log('Que faire?');
		        voiture('reculer');
		        break;
		}
	} else { //On est a moins de 20cm des obstacles, on recule
		console.log('Obstacles trop pret - on recule');
		voiture('reculer');
	}
	 	
}

/*
Fonction pour controller la voiture autonome	
*/
function voiture(direction) {
	
	var time = 1000;  //Durée du mouvement 
	
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
		motor2.reverse(120);
		motor4.reverse(120);
		time = 500;
	} else if(direction == 'droite') {
		motor1.reverse(120);
		motor3.reverse(120);
		motor2.reverse(255);
		motor4.reverse(255);
		time = 500;
	} else {
		motor1.stop();
		motor3.stop();
		motor2.stop();
		motor4.stop();
	}
	board.wait(time, function() {
		motor1.stop();
		motor3.stop();
		motor2.stop();
		motor4.stop();
		setTimeout(BoucleRadar('autonomous'),1000); //on relance le radar pour relancer la boucle scan / choix / direction
	});
}
	
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



