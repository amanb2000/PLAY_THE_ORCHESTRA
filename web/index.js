var app = require('express')();
var http = require('http').Server(app);
var https = require('https');
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');

var api_key = 'WqUjD0EL3bqerPdCIMQ8y/LYgP8obojek7E74c3LIlhhikhsH4KGHhXHBagSnwb77qPcHjQhWDFmTmSL15qatQ==';
var connCount = -1;
var numOfSections = 4;
var sprites = ['staff.png', 'sharp.png', 'quarter.png', 'quarterP.png', 'treble.png', 'ledger_line.png'];
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

// Azure
var options = {
  hostname: 'ussouthcentral.services.azureml.net',
  path: '/workspaces/fd5c4b62dde14c5a83e5a62cc4d30a39/services/d78460f565d14299b15e570dd5864cb6/execute?api-version=2.0&details=true',
  method: 'POST',
  headers: {
    'Content-type': 'application/json',
    Authorization: 'Bearer ' + api_key
  }
}

app.get('/', function(req, res){
  if (connCount < 0) {
    res.sendFile(__dirname + '/test.html');
  } else {
    res.sendFile(__dirname + '/drone.html');
  }
});

io.on('connection', function(socket) {
  console.log('Connection Made');
  if (connCount >= 0) {
    var sname = 'Section ' + (connCount % numOfSections + 1);
    socket.join(sname);
    socket.emit("section-name", sname);
    socket.emit("key-chng", getKeyName(key));
  } else {
    socket.join("master");
  }
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
  socket.on('chord-release', function(msg) {
    for (i=0;i<numOfSections; i++) {
      io.to('Section ' + (i % numOfSections + 1)).emit('chord-req', 0);
      io.emit('chord-chng', "");
    }
  });
  socket.on('chng-key', function(msg) {
    console.log(msg);
    key = parseInt(msg);
    keyName = getKeyName(key);
    io.emit('key-chng', keyName);
  });
  socket.on('chord-msg', function(msg){
    if (msg == null) {
      io.emit('chord-chng', "");
      return;
    }
    noteArr = msg.split(',');
    noteArr.forEach(function (elem, ind) { noteArr[ind] = parseInt(elem)});
    submission = noteArr.slice(0);
    // Transpose Section 1!
    submission[0] = transposeNote(submission[0], keyNum.FS);
    notes = getNoteNameArray(noteArr);
    chordName = getChordName(notes)
    subNotes = getNoteNameArray(submission);
    // Get the chord data & Save
    // Key variable name: "key"
    // Notes array input: "noteArr" (midi #s)
    // THESE ARE AMAN'S FUNCTIONS FOR GETTING the DEGREES of the LAST FOUR CHORDS based on
    // Strategy: To simplify this, I'll use the last 4 notes as the thing to send in.
    noteNums = [];
    for(i = 0; i < notes.length; i++){
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
    if (noteNums.length != 0) {
      while(noteNums.length < 4){
        noteNums.push(noteNums[0]);
      }
      data_out = {
        "Inputs": {
          "input1": {
            "ColumnNames": ["2", "4", "3", "7"],
            "Values": [noteNums]},
          },
         "GlobalParameters": {}
       };

       azReq = https.request(options, (response) => {

         var res = '';
         response.on('data', function(chunk) {
           res += chunk;
         });

         response.on('end', function() {
           data_result = JSON.parse(res);
           final_pred = data_result.Results.output1.value.Values[0][4];
           chord_sugg = Math.round((7/0.06139)*(final_pred - 3.973564));
           chord_sugg = (chord_sugg > 7) ? 7 : chord_sugg;
           chord_sugg = (chord_sugg < 1) ? 1 : chord_sugg;
           tt = tonics[chord_sugg-1];
           fnl = key + tt + 60;
           pp = getNoteName(fnl);
           io.to("master").emit("suggest", pp.substring(0, 1));
         });
       });

      azReq.write(JSON.stringify(data_out));
      azReq.end();
    }
    for (i=0;i<numOfSections; i++) {
      final = (i >= subNotes.length) ? 0 : subNotes[i];
      io.to('Section ' + (i % numOfSections + 1)).emit('chord-req', final);
    }
    if (chordName != 0 && chordName != 1) {
      io.emit('chord-chng', chordName);
    }
  });
});

http.listen(3000, function() {
  console.log('listening on 192.168.122.101:3000');
})

function transposeNote(noteNum, newKey) {
  if (newKey == keyNum.AS) {
    return noteNum - 2;
  } else if (newKey == keyNum.FS) {
    return noteNum - 3;
  }
  return noteNum;
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
