__author__ = 'Elie'

#Prend une photo du stream mjpgstreamer et lenvoi ensuite pour detection visage


#!/usr/bin/python

import subprocess
import datetime
import sys

import cv2
import numpy

nom = sys.argv[1]
now = datetime.datetime.now()
image_url= now.strftime("%Y_%m_%d_%H_%M_%S")+(".jpg")
foldersrc = "/home/pi/projects/robots/car-surveillance/node/client/recofaciale/dataset/src/"+nom +"/"
folderface = "/home/pi/projects/robots/car-surveillance/node/client/recofaciale/dataset/face/"+nom +"/"
cascPath = "/home/pi/projects/robots/facerec/py/apps/videofacerec/haarcascade_frontalface_alt2.xml"

# capture image

SnapImage = foldersrc + now.strftime("%Y_%m_%d_%H_%M_%S") + (".jpg")
imagerec = folderface+image_url
print 'Prise de photo'
subprocess.call(["/usr/bin/wget","-O",SnapImage,"http://81.64.49.145:8080/?action=snapshot"])
print 'Debut detection'
faceCascade = cv2.CascadeClassifier(cascPath)
# Read the image
image = cv2.imread(SnapImage)
print 'load image OK {0}'.format(SnapImage)
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
# Detect faces in the image
print 'Debut visage'
faces = faceCascade.detectMultiScale(
    gray,
    scaleFactor=1.1,
    minNeighbors=5,
    minSize=(30, 30),
    flags = cv2.cv.CV_HAAR_SCALE_IMAGE
)
print 'Fin visage'
print "Found - {0} - faces!".format(len(faces))


# Draw a rectangle around the faces
for (x, y, w, h) in faces:
    #on crop pour avoir que le visage
    print 'ok'
    sub_face = image[y:y+h, x:x+w]
    cv2.imwrite(imagerec , sub_face)
    print 'ok2'
    #on previens Node.js de limage croper
    #print "-->PY: crop*"+crop
    #on ajoute le rectangle vert autour du visage
    #cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)

#on enregistre limage finale avec le rectangle vert
#cv2.imwrite(image_rec, image)
print 
print 'ok3'+image_url
print '1**{"type": "response-python", "code":"100", "message": {"image":"'+image_url+'", "foldersrc":"'+foldersrc+'","imageface":"'+imagerec+'", "folderface":"'+folderface+'" }}'

print 'ok4'