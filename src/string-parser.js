var Parser = require('./parser.js');

var ENTITYMAP = { b: '\b', f: '\b', n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\' };

var StringParser = function(stream, onupdate) {
  var that = Parser.call(this, stream, onupdate, 'String');

  var parseEntity = function(data) {
    if(data === 'u') {
      stream.read(4, function(data) {
        update(String.fromCharCode(parseInt(data, 16)));
        stream.read(1, parseChar);
      });
    } else {
      var char = ENTITYMAP[data];
      if(!char) that.$error('invalid entity "\\' + data + '"');
      update(char);
      stream.read(1, parseChar);
    }
  };

  var parseChar = function(data) {
    if(data === '\\') {
      stream.read(1, parseEntity);
    } else if(data === '"') {
      that.$update('COMPLETE');
    } else {
      update(data);
      stream.read(1, parseChar);
    }
  };

  var update = function(data) {
    that.result += data;
    that.$update('LOADING');
  };

  stream.read(1, function(data) {
    if(data !== '"') that.$error('string must be wrapped by double quote');
    that.result = '';
    that.$update('LOADING');
    stream.read(1, parseChar);
  });

};

StringParser.prototype = new Parser();

module.exports = StringParser;

