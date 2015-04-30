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
	    (1, eval)('var JSONStream');
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

	var syncCallingCount = 0;
	Stream.prototype.read = function(count, callback) {
	  if(this.$reading) throw new Error('Stream: don\'t call repeatedly "read"');
	  if(this.$data.length < this.$index + count) {
	    if(this.state === 'ENDED') throw new Error('Stream: read from EOF');
	    this.$reading = function() {
	      this.read(count, callback);
	    };
	  } else {
	    var result = this.$data.slice(this.$index, this.$index + count);
	    this.$index += count;
	    if(syncCallingCount++ < 1024) {
	      callback(result);
	    } else {
	      syncCallingCount = 0;
	      setTimeout(function() {
	        callback(result);
	      });
	    }
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



/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var Parser = __webpack_require__(3);

	var ENTITYMAP = { b: '\b', f: '\b', n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\', '/': '/' };

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



/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var Parser = __webpack_require__(3);

	var ArrayParser = function(stream, onupdate) {

	  var ValueParser = __webpack_require__(1);

	  var that = Parser.call(this, stream, onupdate, 'Array');

	  var parseItem = function() {
	    var index = that.result.length;
	    new ValueParser(stream, function() {
	      that.result[index] = this.result;
	      that.$update('LOADING');
	      if(this.state !== 'COMPLETE') return;
	      stream.read(1, function(data) {
	        switch(data) {
	          case ']':
	            return that.$update('COMPLETE');
	          case ',':
	            return parseItem();
	          default:
	            that.$error('invaild array item');
	        }
	      });
	    });
	  };

	  stream.read(1, function(data) {
	    if(data !== '[') that.$error('array must be wrapped by "["');
	    that.result = [];
	    that.state = 'LOADING';
	    stream.read(1, function(data) {
	      if(data === ']') {
	        that.$update('COMPLETE');
	      } else {
	        stream.$index--;
	        parseItem();
	      }
	    });
	  });

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

	  var parseItem = function() {
	    new StringParser(stream, function() {
	      if(this.state !== 'COMPLETE') return;
	      var key = this.result;
	      stream.read(1, function(data) {
	        if(data !== ':') that.$error('pair must split by ":"');
	        new ValueParser(stream, function() {
	          that.result[key] = this.result;
	          that.$update('LOADING');
	          if(this.state !== 'COMPLETE') return;
	          stream.read(1, function(data) {
	            switch(data) {
	              case '}':
	                return that.$update('COMPLETE');
	              case ',':
	                return parseItem();
	              default:
	                that.$error('invaild array item');
	            }
	          });
	        });
	      });
	    });
	  };

	  stream.read(1, function(data) {
	    if(data !== '{') that.$error('object must be wrapped by "{"');
	    that.result = {};
	    that.state = 'LOADING';
	    stream.read(1, function(data) {
	      if(data === '}') {
	        that.$update('COMPLETE');
	      } else {
	        stream.$index--;
	        parseItem();
	      }
	    });
	  });

	};

	ObjectParser.prototype = new Parser();

	module.exports = ObjectParser;



/***/ }
/******/ ]);