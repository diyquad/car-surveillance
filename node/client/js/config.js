 ipserver = "http://192.168.0.25:5001/";
 folder_recofaciale = "/recofaciale/";
 ipwebcam = ipserver+"?action=stream";

var config	= function(opts)
{
	opts			= opts			|| {};
	this.ipserver	= ipserver;
	this.folder_recofaciale  =folder_recofaciale;
	this.ipwebcam = ipwebcam;
	
}
config.ipserver	= function(){ return this.ipserver;	}
config.folder_recofaciale	= function(){ return this.folder_recofaciale;	}
config.ipwebcam	= function(){ return this.ipwebcam;	}