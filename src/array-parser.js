var Parser = require('./parser.js');

var ArrayParser = function(stream, onupdate) {

  var ValueParser = require('./value-parser.js');

  var that = Parser.call(this, stream, onupdate, 'Array');

  var state = 'ENTITY';
  var length = 1;
  var parse = function() {
    var data;
    while(data = stream.read(length)) {
      switch(state) {
        case 'ENTITY':
          if(data !== '[') that.$error('array must be wrapped by "["');
          that.result = [];
          that.state = 'LOADING';
          state = 'NEXT';
          break;
        case 'NEXT':
          if(data === ']') {
            that.$update('COMPLETE');
            return;
          } else if(that.result.length === 0) {
            stream.$index--;
          } else if(data !== ',') {
            that.$error('require a comma here');
          }
          state = 'ITEM';
          break;
        case 'ITEM':
          stream.$index--;
          var index = that.result.length;
          var callback = function() {
            callback = null;
          }
          new ValueParser(stream, function() {
            that.result[index] = this.result;
            that.$update('LOADING');
            if(this.state !== 'COMPLETE') return;
            if(callback) callback();
          });
          state = 'NEXT';
          if(callback) {
            callback = parse;
            return;
          }
      }
    }
    stream.$reading = parse;
  };

  parse();

};

ArrayParser.prototype = new Parser();

module.exports = ArrayParser;

