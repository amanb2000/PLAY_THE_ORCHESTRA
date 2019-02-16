// Variable which tell us what step of the game we're on.
// We'll use this later when we parse noteOn/Off messages
var currentStep = 0;

// Timer length
var timerLength = 1; // in minutes

// Lock 1 variables
var correctNoteSequence = [60, 65, 69, 65, 69, 67, 65, 62, 60]; // Amazing Grace in F
var activeNoteSequence = [];

// Lock 2 variables
var correctChord = [60, 64, 67, 70]; // C7 chord starting on middle C
var activeChord = [];

if (navigator.requestMIDIAccess) {
	console.log('This browser supports WebMIDI!');

	navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

} else {
	console.log('WebMIDI is not supported in this browser.');
	document.querySelector('.step0').innerHTML = 'Error: This browser does not support WebMIDI.';
}

function onMIDISuccess(midiAccess) {
	document.querySelector('.step0').innerHTML = 'Press any note to begin...';
	var inputs = midiAccess.inputs;
	var outputs = midiAccess.outputs;

	for (var input of midiAccess.inputs.values()) {
		input.onmidimessage = getMIDIMessage;
	}
}

function onMIDIFailure() {
	document.querySelector('.step0').innerHTML = 'Error: Could not access MIDI devices. Connect a device and refresh to try again.';
}

function getMIDIMessage(message) {
	var command = message.data[0];
	var note = message.data[1];
	var velocity = (message.data.length > 2) ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

	switch (command) {
		case 144: // noteOn
			if (velocity > 0) {
				noteOnListener(note, velocity);
			} else {
				noteOffListener(note);
			}
			break;
		case 128: // noteOff
			noteOffCallback(note);
			break;
		// we could easily expand this switch statement to cover other types of commands such as controllers or sysex
	}
}


function noteOnListener(note, velocity) {

	switch(currentStep) {
		// If the game hasn't started yet.
		// The first noteOn message we get will run the first sequence
		case 0:
			// Run our start up sequence
			runSequence('gamestart');

			// Increment the currentStep so this is only triggered once
			currentStep++;

			break;

		// The first lock - playing a correct sequence
		case 1:
			// add the note to the array
			activeNoteSequence.push(note);

			// show the requisite number of note placeholders
			for (var i = 0; i < activeNoteSequence.length; i++) {
				document.querySelector('.step1 .note:nth-child(' + (i + 1) + ')').classList.add('on');
			}

			// when the array is the same length as the correct sequence, compare the two
			if (activeNoteSequence.length == correctNoteSequence.length) {
				var match = true;
				for (var index = 0; index < activeNoteSequence.length; index++) {
					if (activeNoteSequence[index] != correctNoteSequence[index]) {
						match = false;
						break;
					}
				}

				if (match) {
					// Run the next sequence and increment the current step
					runSequence('lock1');
					currentStep++;
				} else {
					// Clear the array and start over
					activeNoteSequence = [];

					var lockInput = document.querySelector('.step1 .lock-input');

					lockInput.classList.add('error');
					window.setTimeout(function(){
						lockInput.classList.remove('error');
						for (var note of lockInput.querySelectorAll('.note')) {
							note.classList.remove('on');
						}
					}, 500);

				}
			}
			break;

		case 2:
			// add the note to the active chord array
			activeChord.push(note);

			// show the number of active notes
			for (var i = 0; i < activeChord.length; i++) {
				document.querySelector('.step2 .note:nth-child(' + (i + 1) + ')').classList.add('on');
			}

			// If the array is the same length as the correct chord, compare
			if (activeChord.length == correctChord.length) {
				var match = true;
				for (var index = 0; index < activeChord.length; index++) {
					if (correctChord.indexOf(activeChord[index]) < 0) {
						match = false;
						break;
					}
				}

				if (match) {
					runSequence('lock2');
					currentStep++;
				} else {
					var lockInput = document.querySelector('.step2 .lock-input');

					lockInput.classList.add('error');
					window.setTimeout(function(){
						lockInput.classList.remove('error');
					}, 500);
				}
			}
			break;
	}
}

function noteOffListener(note) {

	switch(currentStep) {
		case 2:
			// Remove the note value from the active chord array
			activeChord.splice(activeChord.indexOf(note), 1);

			// Hide the last note shown
			document.querySelector('.step2 .note:nth-child(' + (activeChord.length + 1) + ')').classList.remove('on');
			break;
	}
}

function runSequence(sequence) {
	switch(sequence) {
		case 'gamestart':
			// Now we'll start a countdown timer...
			startTimer();

			// code to trigger animations, give a clue for the first lock
			advanceScreen();
			successFlicker();
			break;

		case 'lock1':
			// code to trigger animations and give clue for the next lock
			advanceScreen();
			successFlicker();
			break;

		case 'lock2':
			// code to trigger animations, stop clock, end game
			advanceScreen();
			successFlicker();
			break;

		case 'gameover':
			currentStep = 3;
			document.querySelector('.step3 p').innerHTML = "You lose...";
			document.querySelector('body').dataset.step = "3";
			document.querySelector('body').classList.add('gameover');
			break;
	}
}

function advanceScreen() {
	document.querySelector('body').dataset.step++;
}
function successFlicker() {
	var b = document.querySelector('body')
	b.classList.add('success');
	window.setTimeout(function(){
		b.classList.remove('success');
	}, 2500);
}

function startTimer(){
  // set timer for 60 minutes from start
  var now = new Date();
  timeEnd = new Date(now.getTime() + (timerLength*60*1000) - 1);

  updateTimer();
}
/**
 * Function to update the time remaining every second
 */
function updateTimer() {
	var now = new Date();
	var distance = timeEnd.getTime() - now.getTime();
	var minutes = Math.floor(distance / (1000 * 60));
	var seconds = Math.floor((distance % (1000 * 60)) / 1000);

	if (minutes < 10) minutes = "0" + minutes;
	if (seconds < 10) seconds = "0" + seconds;

	if (currentStep < 3) {
		document.querySelector('#countdown').innerText = minutes + ":" + seconds;

		if (minutes > 0 || seconds > 0) {
			window.setTimeout(function() {
				updateTimer();
			}, 1000);
		} else if (minutes == 0 && seconds == 0) {
			runSequence('gameover');
  		}
	}
}

var lockInput = document.querySelector('.step2 .lock-input');
lockInput.addEventListener('click', function(){
	lockInput.classList.add('error');
	window.setTimeout(function(){
		lockInput.classList.remove('error');
		for (var note of lockInput.querySelectorAll('.note')) {
			note.classList.remove('on');
		}
	}, 500);
});

var notes = lockInput.querySelectorAll('.note');
for (var note of notes) {
	note.addEventListener('mouseover', function(){
		this.classList.add('on');
	});
}