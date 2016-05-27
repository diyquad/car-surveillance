# Script simple qui ajoute un rectangle a des images sur les visages
#
import glob
import os
import sys
import select
import sys
import cv2

cascPath = '/home/pi/projects/libraries/opencv-2.4.9/data/haarcascades/haarcascade_frontalface_alt.xml'

imgout = '/home/pi/projects/robots/images/cropfaces/picture_rect.jpg'
imgface = '/home/pi/projects/robots/images/cropfaces/picture_face_'
destination = '/home/pi/projects/robots/images/cropfaces'
dataset = '/home/pi/projects/robots/images/dataset/divers/lot3'
# Get user supplied values
#imagePath = sys.argv[1]
#cascPath = sys.argv[2]



def is_letter_input(letter):
	# Utility function to check if a specific character is available on stdin.
	# Comparison is case insensitive.
	if select.select([sys.stdin,],[],[],0.0)[0]:
		input_char = sys.stdin.read(1)
		return input_char.lower() == letter.lower()
	return False

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
        print dirname
        for subdirname in dirnames:
            folder_names.append(subdirname)
            print subdirname 
            subject_path = os.path.join(dirname, subdirname)
            for filename in os.listdir(subject_path):
                if filename != '.DS_Store' and filename !='.AppleDouble' and filename != '.Parent' and filename != 'cropfaces':
                    try:
                        print "--->{0}{1}{2}".format(dirname,subdirname,filename)
                        im = cv2.imread(os.path.join(subject_path, filename), cv2.IMREAD_GRAYSCALE)
                        # resize to given size (if given)
                        #if (image_size is not None):
                        #    im = cv2.resize(im, image_size)
                        X.append(np.asarray(im, dtype=np.uint8))
                        y.append(c)
                    except IOError, (errno, strerror):
                        print "I/O error({0}): {1}".format(errno, strerror)
                    except:
                        print "Unexpected error:", sys.exc_info()[0]
                        raise
    return [X,y,folder_names]



count = 1;
for filename in os.listdir(dataset):
    if filename != '.DS_Store' and filename !='.AppleDouble' and filename != '.Parent' and filename != 'cropfaces':
        fichier=dataset +"/"+ filename;
        print "{1}-->{0} <--> {2}".format(filename, count, fichier)
        # Create the haar cascade
        faceCascade = cv2.CascadeClassifier(cascPath)
        # Read the image
        print filename
        image = cv2.imread(fichier)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        # Detect faces in the image
        faces = faceCascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags = cv2.cv.CV_HAAR_SCALE_IMAGE
        )
        print "Found {0} faces!".format(len(faces))
        count = 1
        # Draw a rectangle around the faces
        for (x, y, w, h) in faces:
            #cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)
            sub_face = image[y:y+h, x:x+w]
            face_file_name = imgface + str(y) + ".jpg"
            cv2.imwrite(face_file_name, sub_face)
         #   facecrop = os.path.join(destination,'%03d.jpg' % count)
            count += 1


    cv2.imwrite(imgout, image)
#cv2.imshow('img',img)
#cv2.waitKey(0)
#cv2.destroyAllWindows()
