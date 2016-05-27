__author__ = 'Elie'


import cv2
import sys
import numpy
# Get user supplied values
folder = "/home/pi/projects/robots/car-surveillance/node/client/recofaciale/"

image_name = sys.argv[1]
transistion =  image_name.split(".");
print "-->PY: go2 %s"%transistion

image_name_rectangle = transistion[0]+"_rect."+transistion[1]
imagePath = folder + image_name
image_name_rectangle_Path=folder + image_name_rectangle
crop=transistion[0]+"_crop."+transistion[1]

cascPath = "/home/pi/projects/robots/facerec/py/apps/videofacerec/haarcascade_frontalface_alt2.xml"
print "-->PY: image*"+image_name
print "-->PY: imagePath*"+imagePath
print "-->PY: imageRectPath"+image_name_rectangle_Path


faceCascade = cv2.CascadeClassifier(cascPath)
# Read the image
image = cv2.imread(imagePath)
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
# Detect faces in the image
faces = faceCascade.detectMultiScale(
    gray,
    scaleFactor=1.1,
    minNeighbors=5,
    minSize=(30, 30),
    flags = cv2.cv.CV_HAAR_SCALE_IMAGE
)
print "Found - {0} - faces!".format(len(faces))


# Draw a rectangle around the faces
for (x, y, w, h) in faces:
    #on crop pour avoir que le visage
    sub_face = image[y:y+h, x:x+w]
    cv2.imwrite(folder+crop, sub_face)
    #on previens Node.js de limage croper
    print "-->PY: crop*"+crop
    #on ajoute le rectangle vert autour du visage
    cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)

#on enregistre limage finale avec le rectangle vert
cv2.imwrite(image_name_rectangle_Path, image)
print "-->PY: image_name_rectangle*"+image_name_rectangle
print "-->PY: Fin de la detection de visage"


