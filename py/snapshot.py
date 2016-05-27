__author__ = 'Elie'

#Prend une photo du stream mjpgstreamer et lenvoi ensuite pour detection visage


#!/usr/bin/python

import subprocess
import datetime


print "-->PY:  Prise de la photo<-----"
now = datetime.datetime.now()
image_url= now.strftime("%Y_%m_%d_%H_%M_%S")+(".jpg")
folder = "/home/pi/projects/robots/car-surveillance/node/client/recofaciale/upload/snapshot/"
# capture image

SnapImage = folder + now.strftime("%Y_%m_%d_%H_%M_%S") + (".jpg")

subprocess.call(["/usr/bin/wget","-O",SnapImage,"http://81.64.49.145:8080/?action=snapshot"])

# create a stamp image file
#StampImage = "PondImg_" + now.strftime("%Y_%m_%d_%H_%M_%S") + (".jpg")
#print "-->PY image*"+SnapImage
#print "-->PY folder*"+folder
#print "-->PY image_url*"+image_url
#print "-->PY Fin de la Prise de la photo<-----"
print 'json**{"type": "response-python", "code":"100", "message": {"image":"'+SnapImage+'", "folder":"'+folder+'","image_url":"'+image_url+'" }}'
