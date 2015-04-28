var Parser = require('./parser.js');

var ArrayParser = function(stream, onupdate) {

  var ValueParser = require('./value-parser.js');

  var that = Parser.call(this, stream, onupdate, 'Array');

  var parseItem = function() {
    var index = that.result.length;
    new ValueParser(stream, function() {
      that.result[index] = this.result;
      that.$update('LOADING');
      if(this.state !== 'COMPLETE') return;
      stream.read(1, function(data) {
        switch(data) {
          case ']':
            return that.$update('COMPLETE');
          case ',':
            return parseItem();
          default:
            that.$error('invaild array item');
        }
      });
    });
  };

  stream.read(1, function(data) {
    if(data !== '[') that.$error('array must be wrapped by "["');
    that.result = [];
    that.state = 'LOADING';
    stream.read(1, function(data) {
      if(data === ']') {
        that.$update('COMPLETE');
      } else {
        stream.$index--;
        parseItem();
      }
    });
  });

};

ArrayParser.prototype = new Parser();

module.exports = ArrayParser;

