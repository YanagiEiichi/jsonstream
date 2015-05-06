var Parser = require('./parser.js');

var StringParser = function(stream, onupdate) {
  var that = Parser.call(this, stream, onupdate, 'String');

  var state = 'ENTITY';
  var length = 1;
  var parse = function() {
    var data;
    while(data = stream.read(length)) {
      switch(state) {
        case 'ENTITY':
          if(data !== '"') that.$error('string must be wrapped by double quote');
          that.result = '"';
          that.$update('LOADING');
          state = 'RAW';
          break;
        case 'RAW':
          stream.$index -= length;
          var str = stream.readWithRegExp(/^(?:\\u....|\\[^u]|[^"\\\r\n])+/);
          if(str) that.result += str;
          state = 'CHAR';
          break;
        case 'CHAR':
          that.result += data;
          if(data === '\\') {
            state = 'BACKSLASH';
          } else if(data === '"') {
            that.result = JSON.parse(that.result);
            that.$update('COMPLETE');
            return;
          } else {
            state = 'RAW';
          }
          break;
        case 'BACKSLASH':
          if(data === 'u') {
            state = 'UNICODE';
            length = 4;
          } else {
            that.result += data;
            state = 'RAW';
          }
          break;
        case 'UNICODE':
          that.result += data;
          state = 'RAW';
          length = 1;
          break;
      }
    }
    stream.$reading = parse;
  };
  
  parse();

};

StringParser.prototype = new Parser();

module.exports = StringParser;

