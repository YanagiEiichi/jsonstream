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
    this.$reading = function() {
      this.read(count, callback);
    };
  } else {
    var result = this.$data.slice(this.$index, this.$index + count);
    this.$index += count;
    callback(result);
  }
};

Stream.prototype.end = function(data) {
  this.state = 'ENDED';
  this.write('');
};

module.exports = Stream;

