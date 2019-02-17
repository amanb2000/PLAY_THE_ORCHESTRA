var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');

var connCount = 0
var sprites = ['staff.png', 'sharp.png', 'quarter.png', 'quarterP.png', 'ledger_line.png'];

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
    fs.readFile(__dirname + '/sprites/' + elem, function (err, buf) {
      socket.emit("serve-image-chunk", {image: true, buffer: buf.toString('base64'), title: elem });
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
