# SCRIPT QUI PREND EN ENTREE UNE IMAGE ET RENVOI LA PERSONNE IDENTIFIE 
#
# USAGE: principalement avec le serveur drone1: node.js -> snapshot.py -> ce script pour reco faciale
#
#
#
#

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
sys.path.append('/home/pi/projets/recofacial/facerec-master/py')
# facerec imports
from facerec.model import PredictableModel
from facerec.feature import Fisherfaces
from facerec.distance import EuclideanDistance
from facerec.classifier import NearestNeighbor
from facerec.validation import KFoldCrossValidation
from facerec.serialization import save_model, load_model
# for face detection (you can also use OpenCV2 directly):
from facedet.detector import CascadedDetector

sys.path.append('/home/pi/projets/recofacial/pi-facerec-box')
import config
import face

import re

model_filename = '/home/pi/projets/drone1/training_files/model_family_final.pkl'
model_filename2 = '/home/pi/projets/drone1/training_files/model.xml'
cascade_filename = '/home/pi/projets/drone1/training_files/haarcascade_frontalface_alt2.xml'
#imagePath = sys.argv[1]
imagePath = '/home/pi/projets/recofacial/images/resize/family-resize/Resized-0030.jpg'
filename = '/home/pi/projets/drone1/images/divers/pic-debut.png'
filename2 = '/home/pi/projets/drone1/images/divers/pic-rect.png'
filename3 = '/home/pi/projets/drone1/images/divers/pic-visage.png'
filename4 = '/home/pi/projets/drone1/images/divers/pic-final.png'
filename5 = '/home/pi/projets/drone1/images/divers/pic-fac.jpg'



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

def read_subject_names(path):
    """Reads the folders of a given directory, which are used to display some
        meaningful name instead of simply displaying a number.

    Args:
        path: Path to a folder with subfolders representing the subjects (persons).

    Returns:
        folder_names: The names of the folder, so you can display it in a prediction.
    """
    folder_names = []
    for dirname, dirnames, filenames in os.walk(path):
        for subdirname in dirnames:
            folder_names.append(subdirname)
    return folder_names

def read_images(path, image_size=None):
    """Reads the images in a given folder, resizes images on the fly if size is given.

    Args:
        path: Path to a folder with subfolders representing the subjects (persons).
        sz: A tuple with the size Resizes 

    Returns:
        A list [X, y, folder_names]

            X: The images, which is a Python list of numpy arrays.
            y: The corresponding labels (the unique number of the subject, person) in a Python list.
            folder_names: The names of the folder, so you can display it in a prediction.
    """
    c = 0
    X = []
    y = []
    folder_names = []
    for dirname, dirnames, filenames in os.walk(path):
        for subdirname in dirnames:
            folder_names.append(subdirname)
            subject_path = os.path.join(dirname, subdirname)
            for filename in os.listdir(subject_path):
                print filename
                try:
                    im = cv2.imread(os.path.join(subject_path, filename), cv2.IMREAD_GRAYSCALE)
                    # resize to given size (if given)
                    if (image_size is not None):
                        im = cv2.resize(im, image_size)
                    X.append(np.asarray(im, dtype=np.uint8))
                    y.append(c)
                except IOError, (errno, strerror):
                    print "I/O error({0}): {1}".format(errno, strerror)
                except:
                    print "Unexpected error:", sys.exc_info()[0]
                    raise
            c = c+1
    return [X,y,folder_names]


class App(object):
    def __init__(self, model, camera_id, cascade_filename):
        self.model = model
        self.detector = CascadedDetector(cascade_fn=cascade_filename, minNeighbors=5, scaleFactor=1.1)
        self.cam = create_capture(camera_id)
            
    def run(self):
        frame = cv2.imread(imagePath)
        # Resize the frame to half the original size for speeding up the detection process:
        img = cv2.resize(frame, (frame.shape[1]/2, frame.shape[0]/2), interpolation = cv2.INTER_CUBIC)
        imgout = img.copy()
        print "Detect the faces..."
        detection = self.detector.detect(img)
        print "{0} faces detected...".format(len(detection))
        for i,r in enumerate(detection):
            x0,y0,x1,y1 = r
            # (1) Get face, (2) Convert to grayscale & (3) resize to image_size:
            face = img[y0:y1, x0:x1]
            face = cv2.cvtColor(face,cv2.COLOR_BGR2GRAY)
            face = cv2.resize(face, self.model.image_size, interpolation = cv2.INTER_CUBIC)
            # Get a prediction from the model:
            prediction = self.model.predict(face)[0]
            confidence = self.model.predict(face)[1]
            distance = confidence['distances'][0]
            print "{0} -> distance {1}".format(self.model.subject_names[prediction],distance)
            # Draw the face area in image:
            cv2.rectangle(imgout, (x0,y0),(x1,y1),(0,255,0),2)
            # Draw the predicted name (folder name...):
            draw_str(imgout, (x0-20,y0-20), self.model.subject_names[prediction])
            draw_str(imgout, (x0+20,y0+20), format(distance))


        cv2.imshow('videofacerec', imgout)
        cv2.imwrite(filename4, imgout)

if __name__ == '__main__':
    from optparse import OptionParser

    # We have got a dataset to learn a new model from:
    print "Loading the model..."
    model = load_model(model_filename)
    # We operate on an ExtendedPredictableModel. Quit the application if this
    # isn't what we expect it to be:
    if not isinstance(model, ExtendedPredictableModel):
        print "[Error] The given model is not of type '%s'." % "ExtendedPredictableModel"
        sys.exit()
    # Now it's time to finally start the Application! It simply get's the model
    # and the image size the incoming webcam or video images are resized to:
    print "Starting application..."
    App(model=model,
        camera_id=0,
        cascade_filename=cascade_filename).run()


