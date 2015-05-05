var Parser = require('./parser.js');

var ENTITYMAP = { b: '\b', f: '\b', n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\', '/': '/' };

var StringParser = function(stream, onupdate) {
  var that = Parser.call(this, stream, onupdate, 'String');

  var update = function(data) {
    that.result += data;
    that.$update('LOADING');
  };

  var state = 'ENTITY';
  var length = 1;
  var parse = function() {
    var data;
    while(data = stream.read(length)) {
      switch(state) {
        case 'ENTITY':
          if(data !== '"') that.$error('string must be wrapped by double quote');
          that.result = '';
          that.$update('LOADING');
          state = 'CHAR';
          break;
        case 'CHAR':
          if(data === '\\') {
            state = 'BACKSLASH';
          } else if(data === '"') {
            that.$update('COMPLETE');
            return;
          } else {
            update(data);
          }
          break;
        case 'BACKSLASH':
          if(data === 'u') {
            state = 'UNICODE';
            length = 4;
          } else {
            var char = ENTITYMAP[data];
            if(!char) that.$error('invalid entity "\\' + data + '"');
            update(char);
            state = 'CHAR';
          }
          break;
        case 'UNICODE':
          update(String.fromCharCode(parseInt(data, 16)));
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

