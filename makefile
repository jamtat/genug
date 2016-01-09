run:
	nvm use;node distproc

copyimg:
	rsync -r *.jpg *.png pi@JamPi.local:~/distproc

sendtopi:
	rsync -r encode.js *.jpg *.png package.json pi@JamPi.local:~/distproc
