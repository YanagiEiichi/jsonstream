var Parser = require('./parser.js');

var NumberParser = function(stream, onupdate) {
  var that = Parser.call(this, stream, onupdate, 'Number');

  var sign = '';
  var left = '';
  var right = '';
  var exp = '';

  var parsePoint = function(data) {
    if(data === 'e' || data === 'E') {
      exp = 'E';
      stream.read(1, parseExponent);
    } else if(data >= '0' && data <= '9') {
      right += data;
      parseDigit(parsePoint);
    } else {
      stream.$index--;
      end();
    }
  };

  var parseExponent = function(data) {
    if(data === '-' || data === '+' || (data >= '0' && data <= '9')) {
      exp += data;
      parseDigit(parseExponent);
    } else {
      stream.$index--;
      end();
    }
  };

  var parseDigit = function(next) {
    if(stream.$data.length === stream.$index) { 
      if(stream.state === 'ENDED') {
        end();
      } else {
        stream.$reading = function() {
          parseDigit(next);
        };
      }
    } else {
      stream.read(1, next);
    };
  };

  var parseEntry = function(data) {
    if(data === '-') {
      sign = '-';
      stream.read(1, parseEntry);
    } else if(data === '.') {
      stream.read(1, parsePoint);
    } else if(data === 'e' || data === 'E') {
      exp = 'E';
      stream.read(1, parseExponent);
    } else if(data >= '0' && data <= '9') {
      left += data;
      parseDigit(parseEntry);
    } else {
      stream.$index--;
      end();
    }
  };

  var end = function() {
    var result = (sign + left + '.' + right + exp) * 1;
    if(result !== result) that.$error('invalid number');
    that.result = result;
    that.$update('COMPLETE');
  };
  
  stream.read(1, parseEntry);

};

NumberParser.prototype = new Parser();

module.exports = NumberParser;

