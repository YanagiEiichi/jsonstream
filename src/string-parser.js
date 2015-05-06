var Parser = require('./parser.js');

var ENTITYMAP = { b: '\b', f: '\b', n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\', '/': '/' };

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
          }
          break;
        case 'BACKSLASH':
          if(data === 'u') {
            state = 'UNICODE';
            length = 4;
          } else {
            that.result += data;
            state = 'CHAR';
          }
          break;
        case 'UNICODE':
          that.result += data;
          state = 'CHAR';
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

