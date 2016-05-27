#!/bin/bash
/home/pi/projects/libraries/mjpg-streamer/mjpg_streamer -i "/usr/local/lib/input_uvc.so -f 25 -r 640x480 -ex antishake" -o "/usr/local/lib/output_http.so -w /usr/local/lib/www" &