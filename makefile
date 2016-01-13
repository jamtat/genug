run:
	time node distproc cat.jpg -p convolutionFilter -a boxBlur 5 -m
	
copyimg:
	rsync -r *.jpg *.png pi@JamPi.local:~/distproc

sendtopi:
	rsync -r encode.js *.jpg *.png package.json pi@JamPi.local:~/distproc
