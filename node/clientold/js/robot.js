//////////////////////////////////////////////////////////
//FONCTIONS POUR UTILISER LES SERVICES DU ROBOT
// ENVOI DES COMMANDES AU ROBOT
//////////////////////////////////////////////////////////
function sendCommand (command) {
	console.log('HTML: --->sending command');
	console.log(command);
	socket.emit('robot command', { data: command });
	var commandsplit = command;
	var arraysplit = commandsplit.split("-");
	if (!arraysplit[0]) { arraysplit[0]=="-"; }
	if (!arraysplit[1]) { arraysplit[1]=="-"; }
	//updateInfos(arraysplit[0],arraysplit[1]);
}


function Montrer_visages_detecter(data) {
	
	imagerectangle = data.data.data;
	if(data.data.crop != "") {
		imagecrop = data.data.crop;
	} else {
		imagecrop = "http://192.168.0.25:5001/recofaciale/person-icon.png";
	}
	
	console.log('HTML--->afficher image rectangle: ' + imagerectangle);
	var img = new Image();
	//METHODE 1 SUR DIV
	img.src = '/recofaciale/'+imagerectangle;
	img.width='320';
	$('#canvas-video-reco').html(img);
	
	console.log('HTML--->afficher image crop: ' + imagecrop);
	var imgcrop = new Image();
	//METHODE 1 SUR DIV
	imgcrop.src = imagecrop;
	$('#canvas-video-reco-crop').html(imgcrop);
	
	
	var img = new Image();
	//METHODE 1 SUR DIV
	img.src = imagecrop;
	$('#canvas-video-reco-total').append(img);

}