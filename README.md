## JSON Stream
###### An asynchronous JSON stream parser

#### Usage

```javascript
var stream = new JSONStream();

stream.onupdate = function() {
  // TODO
  console.log(stream.result);
};

stream.oncomplete = function() {
  // TODO
  console.log(stream.result);
};

stream.push(data);
stream.push(data);
······
stream.end();
```

