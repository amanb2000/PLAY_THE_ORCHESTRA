var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');

var connCount = 0
var sprites = ['staff.png', 'sharp.png', 'quarter.png', 'quarterP.png', 'ledger_line.png'];

var keyNum = {
  C: 0,
  CS: 1,
  D: 2,
  E: 3,
  F: 4,
  FS: 5,
  G: 6,
  GS: 7,
  A: 8,
  AS: 9,
  B: 10,
  BS: 11
}

var key = keyNum.C;

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
    console.log(msg);
    if (msg == null) {
      io.emit('chord-chng', "");
      return;
    }
    noteArr = msg.split(',');
    noteArr.forEach(function (elem, ind) { noteArr[ind] = parseInt(elem)});
    notes = getNoteNameArray(noteArr);
    chordName = getChordName(noteArr);
    io.emit('chord-req', notes[0]);
    if (chordName != 0 && chordName != 1) {
      io.emit('chord-chng', chordName);
    }
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
})

function getNoteNameArray(fourArrayIn){
  retVal = [];
  for(i = 0; i < fourArrayIn.length; i++){
    retVal.push(getNoteName(fourArrayIn[i]));
  }
  return retVal;
}

function getNoteName(initialNote){
  var noteString = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  var octave = parseInt(initialNote / 12) - 1;
  var noteIndex = (initialNote % 12);
  var note = noteString[noteIndex];

  return note + octave;
}

function getChordName(numFourArrayIn){
  simpleChord = getBottomThreeChord(numFourArrayIn);
  complexChord = get7Chord(numFourArrayIn);

  if(simpleChord != 0 && simpleChord != 1){
    return simpleChord;
  }
  if(complexChord != 0 && complexChord != 0){
    return complexChord;
  }
  return 0;

}

function getBottomThreeChord(numFourArrayIn){
  if(numFourArrayIn.length < 3){
    return 0;
  }
  arrIn = numFourArrayIn.slice(0,3)
  // console.log("arrIn: " + getNoteNameArray(arrIn))
  var naturalDistance = -1;
  naturalDistance = getNetTriDist(arrIn);
  // console.log('Natural Distance'+naturalDistance)

  var arrInv1 = arrIn.slice();
  arrInv1[2] = arrIn[2]-12;
  arrInv1.sort();

  var naturalDistanceInv1 = -1;
  naturalDistanceInv1 = getNetTriDist(arrInv1);
  // console.log(''+naturalDistanceInv1)

  var arrInv2 = arrInv1.slice();
  arrInv2[2] = arrInv1[2]-12;
  arrInv2.sort();

  var naturalDistanceInv2 = -1;
  naturalDistanceInv2 = getNetTriDist(arrInv2);

  if(naturalDistance === 7){
    arrIn = arrIn
  }
  else if(naturalDistanceInv1 === 7){
    arrIn = arrInv1
  }
  else if(naturalDistanceInv2 == 7){
    arrIn = arrInv2
  }
  else{
    return 1;//indicates further analysis is warranted.
  }

  var major = -1;

  if(arrIn[1]-arrIn[0] === 4){
    major = true;
  }
  else if(arrIn[1]-arrIn[0] == 3){
    major = false;
  }

  if(major === -1){
    return 0;
  }

  bass_name = getNoteName(arrIn[0]);
  bass_name = bass_name.slice(0,bass_name.length-1);

  retVal = bass_name;

  if(major === true){
    retVal += " Major"
  }
  else if(major === false){
    retVal += " Minor"
  }

  return retVal;
}

function get7Chord(numFourArrayIn){
  if(numFourArrayIn.length < 3){
    return 0;
  }
  arrIn = numFourArrayIn.slice(0,3)
  // console.log("arrIn: " + getNoteNameArray(arrIn))
  var naturalDistance = -1;
  naturalDistance = getNetTriDist(arrIn);
  // console.log('Natural Distance'+naturalDistance)

  var arrInv1 = arrIn.slice();
  arrInv1[2] = arrIn[2]-12;
  arrInv1.sort();

  var naturalDistanceInv1 = -1;
  naturalDistanceInv1 = getNetTriDist(arrInv1);
  // console.log(''+naturalDistanceInv1)

  var arrInv2 = arrInv1.slice();
  arrInv2[2] = arrInv1[2]-12;
  arrInv2.sort();

  var naturalDistanceInv2 = -1;
  naturalDistanceInv2 = getNetTriDist(arrInv2);

  if(naturalDistance <= 6){
    arrIn = arrIn
  }
  else if(naturalDistanceInv1 <= 6){
    arrIn = arrInv1
  }
  else if(naturalDistanceInv2 <= 6){
    arrIn = arrInv2
  }
  else{
    return 1;//indicates further analysis is warranted.
  }

  var major = -1;//indicator for the third

  if(arrIn[2]-arrIn[1] === 4){
    major = true;
  }
  else if(arrIn[2]-arrIn[1] == 3){
    major = false;
  }

  if(major == -1){
    return 0;
  }

  var major7 = false;

  if(arrIn[1]-arrIn[0] === 1){
    major7 = true;
  }
  if(arrIn[1]-arrIn[0] === 2){
    major7 = false;//dominant or minor 7
    console.log("MINOR 7")
  }

  if(major7 === -1){
    console.log("RETURNING Badly MINOR 7")
    // return 0;
  }

  bass_name = getNoteName(arrIn[1]);
  bass_name = bass_name.slice(0,bass_name.length-1);

  retVal = bass_name;
  if(major === true){
    if(major7 === true){
      retVal += " Major 7"
    }
    else if(major7 === false){
      retVal += " Dominant 7"
    }
  }
  else if(major === false){
    if(major7 === true){
      retVal += ""
    }
    else if(major7 === false){
      retVal += " Minor 7"
      console.log('There should be some minor 7 going on');
    }
  }

  return retVal;
}

function getNetTriDist(numThreeArrayIn){
  return((numThreeArrayIn[1]-numThreeArrayIn[0]) + (numThreeArrayIn[2]-numThreeArrayIn[1]))
}
