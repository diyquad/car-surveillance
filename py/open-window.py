# Script simple qui ajoute un rectangle a des images sur les visages
#
import glob
import os
import sys
import select
import sys
import cv2

cascPath = '/home/pi/projects/robots/facerec/py/apps/videofacerec/haarcascade_frontalface_alt2.xml'

imgout = '/home/pi/projects/robots/images/cropfaces/picture_rect.jpg'
imgface = '/home/pi/projects/robots/images/cropfaces/picture_face_'
destination = '/home/pi/projects/robots/images/cropfaces'
dataset = '/home/pi/projects/robots/images/dataset/divers/lot2'
# Get user supplied values
#imagePath = sys.argv[1]
#cascPath = sys.argv[2]

image = cv2.imread(imgout)
cv2.imshow('img',image)
cv2.waitKey(0)
cv2.destroyAllWindows()

	