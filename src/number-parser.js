var Parser = require('./parser.js');

var NumberParser = function(stream, onupdate) {
  var that = Parser.call(this, stream, onupdate, 'Number');

  var sign = '';
  var integer = '';
  var decimal = '';
  var exponent = '';

  var state = 'SIGN';
  var parse = function() {
    var data;
    if(stream.state === 'ENDED') {
      end();
      return;
    }
    while(data = stream.read(1)) {
      switch(state) {
        case 'SIGN':
          state = 'INTEGER';
          if(data === '-') {
            sign = '-';
          } else {
            stream.$index--;
          }
          break;
        case 'INTEGER':
          if(data >= '0' && data <= '9') {
            integer += data;
          } else if(data === '.') {
            state = 'DECIMAL';
            decimal = '.';
          } else if(data === 'e' || data === 'E') {
            state = 'EXPONENT';
            exponent = 'E';
          } else {
            stream.$index--;
            end();
            return;
          }
          break;
        case 'DECIMAL':
          if(data >= '0' && data <= '9') {
            decimal += data;
          } else if(data === 'e' || data === 'E') {
            state = 'EXPONENT';
            exponent = 'E';
          } else {
            stream.$index--;
            end();
            return;
          }
          break;
        case 'EXPONENT':
          if(data === '-' || data === '+' || (data >= '0' && data <= '9')) {
            exponent += data;
            break;
          } else {
            stream.$index--;
            end();
            return;
          }
      };
    }
    stream.$reading = parse;
  };

  var end = function() {
    var result = (sign + integer + decimal + exponent) * 1;
    if(result !== result) that.$error('invalid number');
    that.result = result;
    that.$update('COMPLETE');
  };
  
  parse();

};

NumberParser.prototype = new Parser();

module.exports = NumberParser;

