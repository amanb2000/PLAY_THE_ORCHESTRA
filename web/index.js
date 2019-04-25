var express = require('express');
var app = express();
var http = require('http').Server(app);
var https = require('https');
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');

//https://www.sohamkamani.com/blog/2015/08/21/python-nodejs-comm/

var tonics = [0, 2, 4, 5, 7, 9, 11];
var keyNum = {
  C: 0,
  CS: 1,
  D: 2,
  DS: 3,
  E: 4,
  F: 5,
  FS: 6,
  G: 7,
  GS: 8,
  A: 9,
  AS: 10,
  B: 11,
};

var key = 0;

var resses = [];
var groups = [];

var masterData = {
  active: false,
  sections: [
    {
      id: 0,
      title: "Trumpets",
      key: "C#",
      clef: "treble",
      group: 0
    },
    {
      id: 1,
      title: "Trombones",
      key: "E",
      clef: "bass",
      group: 0
    }
  ],
  groups: [
    {
      id: 0,
      title: "Main",
      range: [42,68]
    }
  ]
  allowSpectators: false,
  configured: false
}

var numOfSections = masterData.sections.length;

app.use('/pub', express.static(path.join(__dirname, 'pub')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/landing.html');
});

io.on('connection', function(socket) {
  console.log('Connection Made');
  socket.emit("send-master-data", JSON.stringify(masterData));
  
  // Wait for master
  socket.on('become-master', function() {
    masterData.active = true;
    socket.join('master');
    console.log("Master has joined the session");
  });
  
  // Configuration Checks
  socket.on('request-master-data', function() {
    socket.emit("send-master-data", JSON.stringify(masterData));
  });
  
  socket.on('toggle-spectate', function() {
    masterData.allowSpectators = (masterData.allowSpectators) ? false : true;
  });
  
  socket.on('save-sections', function(data) {
    masterData.sections = JSON.parse(data);
  });

  socket.on('disconnect', function(socket) {
    console.log("Disconnected");
    // Check if disconnected was master
    if (masterData.active) {
      roster = io.in('master').clients((error, cls) => {
        if (cls.length < 1) {
          masterData.active = false;
          console.log("Master has left the session");
        }
      });
    }
  });
  
  socket.on('chord-release', function(msg) {
    for (i=0;i<numOfSections; i++) {
      io.to('Section ' + (i % numOfSections + 1)).emit('chord-req', 0);
      io.emit('chord-chng', "");
    }
  });
  
  socket.on('join-section', function(id) {
    socket.join('section-'+id);
    io.to('section-'+id).emit("send-client-data", JSON.stringify(getSectionData(parseInt(id))));
  });
  
  socket.on('chng-key', function(msg) {
    console.log(msg);
    key = parseInt(msg);
    keyName = getKeyName(key);
    io.emit('key-chng', keyName);
  });
  
  socket.on('chord-msg', function(msg){ // Formulate data packet for 100ms?
    if (msg == null) {
      io.emit('chord-chng', "");
      io.emit('chord-req', 0);
      return;
    }
    noteArr = msg.split(',');
    noteArr.forEach(function (elem, ind) { noteArr[ind] = parseInt(elem)});
    submission = noteArr.slice(0);
    // Transpose Section 1!
    notes = getNoteNameArray(noteArr);
    // Null check notes
    var nullNote = false
    notes.forEach(function (val) { if (val == null || val == NaN) { console.log("asd"); nullNote = true; }});
    if (nullNote) { return; }
    var chordName = getChordName(noteArr);
    if (chordName != 0 && chordName != 1) {
      io.emit('chord-chng', chordName);
    }
    subNotes = getNoteNameArray(submission);
    // Get the chord data & Save
    // Key variable name: "key"
    // Notes array input: "noteArr" (midi #s)
    // THESE ARE AMAN'S FUNCTIONS FOR GETTING the DEGREES of the LAST FOUR CHORDS based on
    // Strategy: To simplify this, I'll use the last 4 notes as the thing to send in.

    noteNums = [];
    for(i = 0; i < notes.length; i++){
      if (notes[i]) {} else { break; }
      notes[i] = notes[i].substring(0, notes[i].length - 1);
      noteNums.push(getNumberOfNote(notes[i]));
      noteNums[i]-=key;
      if(noteNums[i] < 0){
        noteNums[i] = 0;
      }
      else if(noteNums[i] >7){
        noteNums[i] = 7;
      }
    }
    for (i=0;i<numOfSections; i++) {
      final = (i >= noteArr.length) ? 0 : noteArr[i];
      io.to('section-' + (i % numOfSections + 1)).emit('chord-req', final);
    }
  });
}); 

http.listen(3000, function() {
  console.log('listening on 192.168.122.101:3000');
})

function getSectionData(id) {
  var result = null
  masterData.sections.forEach(function(sec) {
    if (sec.id == id){
      result = sec;
    }
  });
  return result;
}

function getNoteNameArray(fourArrayIn){
  retVal = [];
  for(i = 0; i < fourArrayIn.length; i++){
    retVal.push(getNoteName(fourArrayIn[i]));
  }
  return retVal;
}

function getNumberOfNote(strIn){//returns number based on note name.
  var noteString = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return noteString.indexOf(strIn);
}

function getKeyName(keyNum) {
  var noteString = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return noteString[keyNum];
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

  var major7 = -1;

  if(arrIn[1]-arrIn[0] === 1){
    major7 = true;
  }
  if(arrIn[1]-arrIn[0] === 2){
    major7 = false;//dominant or minor 7
  }

  if(major7 === -1){
    return 0;
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
    }
  }

  return retVal;
}

function getNetTriDist(numThreeArrayIn){
  return((numThreeArrayIn[1]-numThreeArrayIn[0]) + (numThreeArrayIn[2]-numThreeArrayIn[1]))
}
