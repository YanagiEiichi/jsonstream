var ValueParser = require('./value-parser.js');
var Stream = require('./stream.js');

JSONStream = function() {
  var that = this;
  var stream = this.$stream = new Stream();
  this.$parser = new ValueParser(stream, function() {
    that.result = this.result;
    switch(this.state) {
      case 'LOADING':
        if(typeof that.onupdate === 'function') that.onupdate(this.result);
        break;
      case 'COMPLETE':
        if(typeof that.oncomplete === 'function') that.oncomplete(this.result);
        break;
    }
  });
}; 

JSONStream.prototype.push = function(data) {
  if(typeof data === 'string') this.$stream.write(data);
};

JSONStream.prototype.end = function() {
  this.$stream.end();
};

// Loader Matcher
switch(true) {
  case typeof angular === 'object' && typeof angular.module === 'function':
    angular.module('JSONStream', []).factory('JSONStream', function() {
      return JSONStream;
    });
    break;
  default:
    (1, eval)('var JSONStream');
    new Function('return this')().JSONStream = JSONStream;
}

