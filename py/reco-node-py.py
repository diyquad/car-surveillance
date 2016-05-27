# SCRIPT QUI PREND EN ENTREE UNE IMAGE ET RENVOI LA PERSONNE IDENTIFIE 
#
# USAGE: principalement avec le serveur drone1: node.js -> snapshot.py -> ce script pour reco faciale
#
#
#
#
import subprocess
import datetime



import logging
import time
# cv2 and helper:
import cv2
import sys
import numpy
sys.path.append('/home/pi/projects/robots/facerec/py/apps/videofacerec/')
from helper.common import *
from helper.video import *
# add facerec to system path
sys.path.append('/home/pi/projects/robots/facerec/py/facedet')
sys.path.append('/home/pi/projects/robots/facerec/py')
# facerec imports
from facerec.model import PredictableModel
from facerec.feature import Fisherfaces
from facerec.distance import EuclideanDistance
from facerec.classifier import NearestNeighbor
from facerec.validation import KFoldCrossValidation
from facerec.serialization import save_model, load_model
# for face detection (you can also use OpenCV2 directly):
from facedet.detector import CascadedDetector


sys.path.append('/home/pi/projects/robots/pi-facerec-box')
import config
import face

import re

model_filename = '/home/pi/projects/robots/car-surveillance/node/client/recofaciale/model/modele1.pkl'
#model_filename2 = '/home/pi/projets/drone1/training_files/model.xml'
cascade_filename = '/home/pi/projects/libraries/opencv-2.4.9/data/haarcascades/haarcascade_frontalface_alt.xml'

now = datetime.datetime.now()
heure= now.strftime("%Y_%m_%d_%H_%M_%S")


#imagePath = sys.argv[1]
imagePath = 'http://81.64.49.145:8080/?action=snapshot'
folder = "/home/pi/projects/robots/car-surveillance/node/client/recofaciale/upload"
SnapImage = folder + '/src/'+ heure + ".jpg"
final = folder + '/final/'+heure + ".jpg"
rectangle = folder + '/thumb/'+heure + ".jpg"
visage = folder + '/face/'+ heure + ".jpg"



camera_id = 0;
size = '92x112'
count = 0;

class ExtendedPredictableModel(PredictableModel):
    """ Subclasses the PredictableModel to store some more
        information, so we don't need to pass the dataset
        on each program call...
    """

    def __init__(self, feature, classifier, image_size, subject_names):
        PredictableModel.__init__(self, feature=feature, classifier=classifier)
        self.image_size = image_size
        self.subject_names = subject_names

def get_model(image_size, subject_names):
    """ This method returns the PredictableModel which is used to learn a model
        for possible further usage. If you want to define your own model, this
        is the method to return it from!
    """
    # Define the Fisherfaces Method as Feature Extraction method:
    feature = Fisherfaces()
    # Define a 1-NN classifier with Euclidean Distance:
    classifier = NearestNeighbor(dist_metric=EuclideanDistance(), k=1)
    # Return the model as the combination:
    return ExtendedPredictableModel(feature=feature, classifier=classifier, image_size=image_size, subject_names=subject_names)


########DEBUT#########        

# We have got a dataset to learn a new model from:
# Check if the given dataset exists:
try:
    image_size = (int(size.split("x")[0]), int(size.split("x")[1]))
except:
    print "[Error] Unable to parse the given image size '%s'. Please pass it in the format [width]x[height]!" % size
    sys.exit()
    



########DEBUT#########

###DEBUT
#print "image a comparer --> {0}".format(imagePath)
count = 0;
identifie = ''
#img = cv2.resize(frame, (frame.shape[1]/2, frame.shape[0]/2), interpolation = cv2.INTER_CUBIC)
#print "-->PY:  Prise de la photo<-----"
subprocess.call(["/usr/bin/wget","-O",SnapImage,"http://81.64.49.145:8080/?action=snapshot"])
#print "{data {message:"+SnapImage+"}}"
img = cv2.imread(SnapImage,1)
#print 'photo OK{0}'.format(SnapImage)
image = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
# Get coordinates of single face in captured image.
print "Loading the model FisherFace"
#fisherface
model = load_model(model_filename)
# We operate on an ExtendedPredictableModel. Quit the application if this
# isn't what we expect it to be:
if not isinstance(model, ExtendedPredictableModel):
    print "[Error] The given model is not of type '%s'." % "ExtendedPredictableModel"
    sys.exit()
#detector = CascadedDetector(cascade_fn=cascade_filename, minNeighbors=5, scaleFactor=1.1)

faceCascade = cv2.CascadeClassifier(cascade_filename)
faces = faceCascade.detectMultiScale(
    image,
    scaleFactor=1.1,
    minNeighbors=5,
    minSize=(30, 30),
    flags = cv2.cv.CV_HAAR_SCALE_IMAGE
)
print "Found {0} faces!".format(len(faces))
for (x, y, w, h) in faces:
    # Crop image as close as possible to desired face aspect ratio.
    # Might be smaller if face is near edge of image.
    crop = face.crop(image, x, y, w, h)
    newcrop = cv2.resize(crop,(100,100))
    sub_face = image[y:y+h, x:x+w]
    cv2.imwrite(visage, sub_face)
    #print "visage extrait"
    #--------FISHERFACE-----------#
    # Get a prediction from the model :
    #prediction = self.model.predict(face)[0]
    prediction, confidence = model.predict(newcrop)
    classifier_output = confidence
    distance = classifier_output['distances'][0]
    # Now you can easily threshold by it:
    #print 'Fisherface: prediction {0} confidence {1}- distance {2}--'.format(prediction,confidence,distance)
    
   #--------AFFICHAGE DES RESULTATS-----------#
    if distance > 1000:
        print "Fisherface -> Unknown Person!"
    else :
        print "Fisherface -> Person is known with label {0}".format(prediction)
            
    print 'identifie : prediction->{0}, confidence->{1}, 2->{2} '.format(model.subject_names[prediction],confidence,prediction)

    #--------AFFICHAGE DES RESULTATS-----------#                   
    # Draw the face area in image:
    cv2.rectangle(img, (x,y), (x+w, y+h),(0,255,0),2)
    cv2.imwrite(rectangle, img)
    # Draw the predicted name (folder name...):
    draw_str(img, (x-20,y-20), model.subject_names[prediction])
    identifie = '{0}'.format(model.subject_names[prediction])
    

cv2.imwrite(final, img)
print 'image:{0}'.format(final)
# Show image & exit on escape:
count +=1
ch = cv2.waitKey(10)
message = "**{0}**" .format(identifie)
if identifie=='':
    print "Aucune personne identifie"
else:
    print "X personne identifie"
#time.sleep(5)
#cv2.destroyWindow("videofacerec")
print message
