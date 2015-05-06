/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var ValueParser = __webpack_require__(1);
	var Stream = __webpack_require__(2);

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
	    [eval][0]('var JSONStream');
	    new Function('return this')().JSONStream = JSONStream;
	}



/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var Parser = __webpack_require__(3);

	var ValueParser = function(stream, onupdate) {

	  var NumberParser = __webpack_require__(4);
	  var StringParser = __webpack_require__(5);
	  var LiteralParser = __webpack_require__(6);
	  var ArrayParser = __webpack_require__(7);
	  var ObjectParser = __webpack_require__(8);

	  var that = Parser.call(this, stream, onupdate, 'Value');
	 
	  var done = function() {
	    that.result = this.result;
	    that.$update(this.state);
	  };

	  var parse = function(data) {
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
	  };

	  var data = stream.read(1);
	  if(data) {
	    parse(data);
	  } else {
	    stream.read(1, parse);
	  }

	};

	ValueParser.prototype = new Parser();

	module.exports = ValueParser;



/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 # Stream Basic Constructor
	 **/

	var Stream = function() {
	  this.state = 'LOADING';
	  this.$data = '';
	  this.$index = 0;
	}

	Stream.prototype.write = function(data) {
	  this.$data += data;
	  if(this.$reading) {
	    var reading = this.$reading;
	    this.$reading = null;
	    reading.call(this);
	  };
	};

	Stream.prototype.read = function(count, callback) {
	  if(this.$reading) throw new Error('Stream: don\'t call repeatedly "read"');
	  if(this.$data.length < this.$index + count) {
	    if(this.state === 'ENDED') throw new Error('Stream: read from EOF');
	    if(callback) {
	      this.$reading = function() {
	        this.read(count, callback);
	      };
	    }
	  } else {
	    var result = this.$data.slice(this.$index, this.$index + count);
	    this.$index += count;
	    if(callback) callback(result);
	    return result;
	  }
	};

	Stream.prototype.end = function(data) {
	  this.state = 'ENDED';
	  this.write('');
	};

	module.exports = Stream;



/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var Parser = function(stream, onupdate, name) {
	  this.result = void 0;
	  this.state = 'UNSOLVED';
	  this.$onupdate = onupdate;
	  this.$name = name;
	  return this;
	};

	Parser.prototype.$update = function(state) {
	  if(state) this.state = state;
	  if(typeof this.$onupdate === 'function') this.$onupdate(this);
	};

	Parser.prototype.$error = function(reason) {
	  throw new Error(this.$name + ' Parser: ' + reason);
	  if(typeof this.$onupdate === 'function') this.$onupdate(this);
	};

	module.exports = Parser;



/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var Parser = __webpack_require__(3);

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



/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var Parser = __webpack_require__(3);

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



/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var Parser = __webpack_require__(3);

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

	  var parse = function(data) {
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
	  };

	  var data = stream.read(1);
	  if(data) {
	    parse(data);
	  } else {
	    stream.read(1, parse);
	  }

	};

	LiteralParser.prototype = new Parser();

	module.exports = LiteralParser;



/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var Parser = __webpack_require__(3);

	var ArrayParser = function(stream, onupdate) {

	  var ValueParser = __webpack_require__(1);

	  var that = Parser.call(this, stream, onupdate, 'Array');

	  var state = 'ENTITY';
	  var length = 1;
	  var parse = function() {
	    var data;
	    while(data = stream.read(length)) {
	      switch(state) {
	        case 'ENTITY':
	          if(data !== '[') that.$error('array must be wrapped by "["');
	          that.result = [];
	          that.state = 'LOADING';
	          state = 'NEXT';
	          break;
	        case 'NEXT':
	          if(data === ']') {
	            that.$update('COMPLETE');
	            return;
	          } else if(that.result.length === 0) {
	            stream.$index--;
	          } else if(data !== ',') {
	            that.$error('require a comma here');
	          }
	          state = 'ITEM';
	          break;
	        case 'ITEM':
	          stream.$index--;
	          var index = that.result.length;
	          var callback = function() {
	            callback = null;
	          }
	          new ValueParser(stream, function() {
	            that.result[index] = this.result;
	            that.$update('LOADING');
	            if(this.state !== 'COMPLETE') return;
	            if(callback) callback();
	          });
	          state = 'NEXT';
	          if(callback) {
	            callback = parse;
	            return;
	          }
	      }
	    }
	    stream.$reading = parse;
	  };

	  parse();

	};

	ArrayParser.prototype = new Parser();

	module.exports = ArrayParser;



/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var Parser = __webpack_require__(3);

	var ObjectParser = function(stream, onupdate) {

	  var StringParser = __webpack_require__(5);
	  var ValueParser = __webpack_require__(1);

	  var that = Parser.call(this, stream, onupdate, 'Object');

	  var state = 'ENTITY';
	  var key;
	  var length = 1;
	  var isFirst = true;
	  var parse = function() {
	    var data;
	    while(data = stream.read(length)) {
	      switch(state) {
	        case 'ENTITY':
	          if(data !== '{') that.$error('object must be wrapped by "{"');
	          that.result = {};
	          that.state = 'LOADING';
	          state = 'NEXT';
	          break;
	        case 'NEXT':
	          if(data === '}') {
	            that.$update('COMPLETE');
	            return;
	          } else if(isFirst) {
	            stream.$index--;
	          } else if(data !== ',') {
	            that.$error('require a comma here');
	          }
	          state = 'KEY';
	          break;
	        case 'KEY':
	          stream.$index--;
	          var callback = function() {
	            callback = null;
	          }
	          new StringParser(stream, function() {
	            that.$update('LOADING');
	            if(this.state !== 'COMPLETE') return;
	            key = this.result;
	            if(callback) callback();
	          });
	          state = 'VALUE';
	          if(callback) {
	            callback = parse;
	            return;
	          }
	          break;
	        case 'VALUE':
	          if(data !== ':') that.$error('pair must split by ":"');
	          var callback = function() {
	            callback = null;
	          }
	          isFirst = false;
	          new ValueParser(stream, function() {
	            that.result[key] = this.result;
	            that.$update('LOADING');
	            if(this.state !== 'COMPLETE') return;
	            if(callback) callback();
	          });
	          state = 'NEXT';
	          if(callback) {
	            callback = parse;
	            return;
	          }
	          break;
	      }
	    }
	    stream.$reading = parse;
	  };

	  parse();

	};

	ObjectParser.prototype = new Parser();

	module.exports = ObjectParser;



/***/ }
/******/ ]);