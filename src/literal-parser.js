var Parser = require('./parser.js');

var LITERALMAP = { 'true': true, 'false': false, 'null': null };

var LiteralParser = function(stream, onupdate) {
  var that = Parser.call(this, stream, onupdate, 'Literal');

  var assert = function(str) {
    stream.$index--;
    stream.read(str.length, function(data) {
      if(data !== str) return error();
      that.result = LITERALMAP[data];
      that.$update('COMPLETE');
    });
  };

  var error = function() {
    that.$error('invalid literal');
  };

  stream.read(1, function(data) {
    switch(data) {
      case 'f':
        return assert('false');
      case 't':
        return assert('true');
      case 'n':
        return assert('null');
      defaut:
        error();
    }
  });

};

LiteralParser.prototype = new Parser();

module.exports = LiteralParser;

