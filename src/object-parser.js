var Parser = require('./parser.js');

var ObjectParser = function(stream, onupdate) {

  var StringParser = require('./string-parser.js');
  var ValueParser = require('./value-parser.js');

  var that = Parser.call(this, stream, onupdate, 'Object');

  var state = 'ENTITY';
  var key;
  var length = 1;
  var isFirst = true;
  var parse = function() {
    var data;
    while(data = stream.read(length)) {
      switch(state) {
        case 'ENTITY':
          if(data !== '{') that.$error('object must be wrapped by "{"');
          that.result = {};
          that.state = 'LOADING';
          state = 'NEXT';
          break;
        case 'NEXT':
          if(data === '}') {
            that.$update('COMPLETE');
            return;
          } else if(isFirst) {
            stream.$index--;
          } else if(data !== ',') {
            that.$error('require a comma here');
          }
          state = 'KEY';
          break;
        case 'KEY':
          stream.$index--;
          var callback = function() {
            callback = null;
          }
          new StringParser(stream, function() {
            that.$update('LOADING');
            if(this.state !== 'COMPLETE') return;
            key = this.result;
            if(callback) callback();
          });
          state = 'VALUE';
          if(callback) {
            callback = parse;
            return;
          }
          break;
        case 'VALUE':
          if(data !== ':') that.$error('pair must split by ":"');
          var callback = function() {
            callback = null;
          }
          isFirst = false;
          new ValueParser(stream, function() {
            that.result[key] = this.result;
            that.$update('LOADING');
            if(this.state !== 'COMPLETE') return;
            if(callback) callback();
          });
          state = 'NEXT';
          if(callback) {
            callback = parse;
            return;
          }
          break;
      }
    }
    stream.$reading = parse;
  };

  parse();

};

ObjectParser.prototype = new Parser();

module.exports = ObjectParser;

