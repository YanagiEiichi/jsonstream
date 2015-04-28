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

