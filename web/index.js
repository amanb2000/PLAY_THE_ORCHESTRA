var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connCount = 0

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
