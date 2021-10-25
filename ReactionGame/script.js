///////////////////////////////
// JS Code for Reaction Game //
// Author: Ethan Danahy      //
// Date: October 24th, 2021  //
///////////////////////////////


//////////////////////////
// * GLOBAL VARIABLES * //
//////////////////////////

// SPIKE PRIME INTERACTION GLOBAL VARIABLES

var mySPIKE1 = null;
var mySPIKE2 = null;
var mySPIKE_reward = null;
var force1 = null; // player 1 controls (first SPIKE Prime hub)
var force2 = null; // player 2 controls (second SPIKE Prime hub) 

function player1_reward() {
	// if player 1 wins, execute program in slot 0 on reward SPIKE
	if (mySPIKE_reward.isActive()) { mySPIKE_reward.executeProgram(0); }
	else { alert('must activate Reward SPIKE Prime'); }
}
function player1_punishment() {
	// if player 1 loses, execute program in slot 0 on SPIKE 1
	if (mySPIKE1.isActive()) { mySPIKE1.executeProgram(0); }
	else { alert('must activate Player 1 SPIKE Prime'); }
}
function player2_reward() {
	// if player 2 wins, execute program in slot 1 on reward SPIKE
	if (mySPIKE_reward.isActive()) { mySPIKE_reward.executeProgram(1); }
	else { alert('must activate Reward SPIKE Prime'); }
}
function player2_punshment() {
	// if player 2 loses, execute program in slot 0 on SPIKE 2
	if (mySPIKE2.isActive()) { mySPIKE2.executeProgram(0); }
	else { alert('must activate Player 2 SPIKE Prime'); }
}

// REACTION GAME GLOBAL VARIABLES

var items = Array('Fruit1.png', 'Fruit2.png', 'Fruit3.png', 'Fruit4.png', 'Fruit5.png', 'Fruit6.png', 
				'Fruit7.png', 'Fruit8.png', 'Fruit9.png');
var item_list = null; // this will hold a temp copy of the items each time game is played
var image_ref = null;
var image_match = null;

var speed = 500; // number of milliseconds to flash image options
var min_wait = 5; // minimum number of images to show before showing match
var max_wait = 10; // maximum number of images to show before showing match
var wait_count = 0; // number left (countdown) of non-matches to show (set when game starts, reset when match shown)

var interrupt = false; // if the game play has been interrupted (e.g. by user pushing a button, for instance)
var monitor_user_speed = 50; // how fast, in ms, to monitor the user input
var force_threshold = 3; // how hard the force sensor needs to be pushed to count

// once the DOM is loaded, set up the global variables
window.onload = function() {
	// setup SPIKE Prime Hub Connections:
	mySPIKE1 = document.getElementById("service_SPIKE1").getService();
	mySPIKE2 = document.getElementById("service_SPIKE2").getService();
	mySPIKE_reward = document.getElementById("service_SPIKE3").getService();
	
	// when SPIKE Primes are activated (via the SPIKE Prime Service Dock), init variables
	mySPIKE1.executeAfterInit(async function() {
		force1 = new mySPIKE1.ForceSensor("A");
	});
	mySPIKE2.executeAfterInit(async function() {
		force2 = new mySPIKE2.ForceSensor("A");
	});

	// setup reaction game specific variables
	image_ref = document.getElementById("image_ref");
	image_match = document.getElementById("image_match");
}

/////////////////////////////
// * INTERFACE FUNCTIONS * //
/////////////////////////////

// INTERFACE FUNCTIONS

// toggle display (show or not) of the controls
function hideControls() {
	var controls = document.getElementById("controls");
	if (controls.style.display === "none") { controls.style.display = "block"; }
	else { controls.style.display = "none"; }
}
// display hardware setup instructions!
function setupInfo() {
	var alert_text = "** Hardware Setup: **\n";
	alert_text += "Player 1: Force on A, Punishment in Slot 0\n"
	alert_text += "Player 2: Force on A, Punishment in Slot 0\n"
	alert_text += "Reward Hub: Player 1 Reward in Slot 0, Player 2 Reward in Slot 1\n"
	alert(alert_text)
}

////////////////////////////
// * GAMEPLAY FUNCTIONS * //
////////////////////////////

// GAME FUNCTIONS

// if they hit the play button
function play() {
	item_list = items.slice(); // create copy by value, leaving original list intact
	// THIS LINE:
	// - determines a random item in the list (random index based on length of list)
	// - uses SPLICE to remove that item from the list, setting it to be the reference item
	// - updates item_list (remove in place) as a new list of all other items OTHER than reference
	var reference_item = item_list.splice(Math.floor(Math.random()*item_list.length), 1);
	image_ref.src = reference_item; // display reference item

	interrupt = false;	// set this to be false (meaning game is playing, no one has clicked yet)
	result_display('',''); // clear any previous results being shown
	set_wait_count();	// set up the number of times to show non-matches
	show_random_item();	// start showing random items
	monitor_users();	// start monitoring the inputs
}
// set up (initialize) the wait_count variable
function set_wait_count() {
	// does a "Getting a random integer between two values, inclusive"
	// from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
	var min = Math.ceil(min_wait);
	var max = Math.floor(max_wait);
	// The maximum is inclusive and the minimum is inclusive
	wait_count = Math.floor(Math.random() * (max - min + 1) + min);
}
// uses item_list to show random item
function show_random_item() {
	if (interrupt) { return; }
	else {
		if (wait_count == 0) {
			// have show enough random images
			// time to show a match
			image_match.src = image_ref.src; // they now match!
			// reset wait count
			set_wait_count();
		} else {
			// keep selecting a random image
			var item = item_list[Math.floor(Math.random()*item_list.length)];
			image_match.src = item;
			// decrement wait count
			wait_count = wait_count - 1;
		}
		// check interrupt again, JUST in case it happened while switching images
		if (!interrupt) {
			// keep showing random items
			setTimeout(show_random_item, speed);
		}
	}
}

// monitor users
function monitor_users() {
	if (interrupt) { return; } // if there has been an interrupt, then stop
	var f1newtons = 0; var f2newtons = 0; // default values

	// get user values (null check is to make sure it was initialized
	if (force1 != null) { f1newtons = force1.get_force_newton(); }
	if (force2 != null) { f2newtons = force2.get_force_newton(); }

	// check if any have been pushed
	if (f1newtons > force_threshold) { interrupt = true; end_game(1); return; }
	if (f1newtons > force_threshold) { interrupt = true; end_game(2); return; }
	
	// keep showing random items
	setTimeout(monitor_users, monitor_user_speed); // set timeout to check again
}
// figure out end game status
// - player_signal is which player "clicked"
function end_game(player_signal) {
	var result_color = "";
	var result_text = "";
	if (image_match.src == image_ref.src) {
		// then we have a match! user wins
		result_color = "LightGreen";
		result_text = "YES! Player " + player_signal + " was right!";
		// give reward
		if (player_signal == 1) { player1_reward(); }
		if (player_signal == 2) { player2_reward(); }
	} else {
		// the images do NOT match, so the user should NOT have clicked
		result_color = "LightSalmon";
		result_text = "Uh-oh. Player " + player_signal + " was WRONG!";
		// give punishment
		if (player_signal == 1) { player1_punishment(); }
		if (player_signal == 2) { player2_punishment(); }
	}
	result_display(result_color, result_text);
}

// display result
function result_display(color, text) {
	var resultarea = document.getElementById("resultrow");
	var resulttext = document.getElementById("result");
	resultarea.setAttribute("bgColor", color);
	resulttext.innerHTML = text;
}
// clear previous result
function result_clear() { result_display('', ''); }
