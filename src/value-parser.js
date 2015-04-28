var Parser = require('./parser.js');

var ValueParser = function(stream, onupdate) {

  var NumberParser = require('./number-parser.js');
  var StringParser = require('./string-parser.js');
  var LiteralParser = require('./literal-parser.js');
  var ArrayParser = require('./array-parser.js');
  var ObjectParser = require('./object-parser.js');

  var that = Parser.call(this, stream, onupdate, 'Value');
 
  var done = function() {
    that.result = this.result;
    that.$update(this.state);
  };

  stream.read(1, function(data) {
    stream.$index--;
    switch(data) {
      case '"':
        return new StringParser(stream, done);
      case 't':
      case 'f':
      case 'n':
        return new LiteralParser(stream, done);
      case '{':
        return new ObjectParser(stream, done);
      case '[':
        return new ArrayParser(stream, done);
      default:
        return new NumberParser(stream, done);
    }
  });

};

ValueParser.prototype = new Parser();

module.exports = ValueParser;

