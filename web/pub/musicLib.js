function vexify(noteNum) {
  val = getNoteName(noteNum);
  val = val.toLowerCase();
  valArr = val.split('');
  if (valArr.length > 2) {
    sharp = true;
  } else {
    sharp = false;
  }
  valArr.push(valArr[valArr.length-1]);
  valArr[valArr.length - 2] = "/";
  final = valArr.join('');
  return [final, sharp]
}

function getNoteName(initialNote){
  var noteString = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  var octave = parseInt(initialNote / 12) - 1;
  var noteIndex = (initialNote % 12);
  var note = noteString[noteIndex];

  return note + octave;
}

var keyNum = {
  C: "C",
  CS: "C#",
  D: "D",
  DS: "D#",
  E: "E",
  F: "F",
  FS: "F#",
  G: "G",
  GS: "G#",
  A: "A",
  AS: "A#",
  B: "B",
};

function transposeNote(noteNum, newKey) { // This needs to legit work
  if (newKey == keyNum.AS) {
    return noteNum - 2;
  } else if (newKey == keyNum.DS) {
    return noteNum + 3;
  }
  return noteNum;
}
