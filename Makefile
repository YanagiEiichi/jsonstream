default: require build

require:
	npm install

build:
	node_modules/.bin/webpack src/entity.js jsonstream.js

