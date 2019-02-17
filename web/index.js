var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');

var connCount = 0
var sprites = ['staff.png', 'quarter.png', 'sharp.png', 'quarterP.png', 'ledger_line.png'];

app.get('/', function(req, res){
  if (connCount < 1) {
    res.sendFile(__dirname + '/test.html');
  } else {
    res.sendFile(__dirname + '/drone.html');
  }
});

io.on('connection', function(socket) {
  console.log('Connection Made');
  connCount++;
  sprites.forEach(function(elem) {
    socket.emit("image-notify");
    var readStream = fs.createReadStream(path.resolve(__dirname, './sprites/' + elem), {
      encoding: 'binary'
    }), chunks = [];

    readStream.on('readable', function() {
      console.log("Loading img");
    });

    readStream.on('data', function(chunk) {
      console.log("ASda");
      chunks.push(chunk);
      socket.emit('serve-image-chunk', chunk);
    });

    readStream.on('end', function() {
      console.log("Image loaded");
    });
  });

  socket.on('disconnection', function(socket) {
    connCount--;
    console.log("Disconnected");
  });
  socket.on('chord-msg', function(msg){
    io.emit('chord-req', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
})
