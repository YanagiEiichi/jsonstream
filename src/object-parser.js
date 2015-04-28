var Parser = require('./parser.js');

var ObjectParser = function(stream, onupdate) {

  var StringParser = require('./string-parser.js');
  var ValueParser = require('./value-parser.js');

  var that = Parser.call(this, stream, onupdate, 'Object');

  var parseItem = function() {
    new StringParser(stream, function() {
      if(this.state !== 'COMPLETE') return;
      var key = this.result;
      stream.read(1, function(data) {
        if(data !== ':') that.$error('pair must split by ":"');
        new ValueParser(stream, function() {
          that.result[key] = this.result;
          that.$update('LOADING');
          if(this.state !== 'COMPLETE') return;
          stream.read(1, function(data) {
            switch(data) {
              case '}':
                return that.$update('COMPLETE');
              case ',':
                return parseItem();
              default:
                that.$error('invaild array item');
            }
          });
        });
      });
    });
  };

  stream.read(1, function(data) {
    if(data !== '{') that.$error('object must be wrapped by "{"');
    that.result = {};
    that.state = 'LOADING';
    stream.read(1, function(data) {
      if(data === '}') {
        that.$update('COMPLETE');
      } else {
        stream.$index--;
        parseItem();
      }
    });
  });

};

ObjectParser.prototype = new Parser();

module.exports = ObjectParser;

