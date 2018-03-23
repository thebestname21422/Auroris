var chalk = require("chalk");
var util = require("util");
var colours = require('colors');

function start() {
	let logo = [
		"     _                        _     		",
		"    / \\  _   _ _ __ ___  _ __(_)___ 		",
		"   / _ \\| | | | '__/ _ \\| '__| / __|		",
		"  / ___ \\ |_| | | | (_) | |  | \\__ \\	",
		" /_/   \\_\\__,_|_|  \\___/|_|  |_|___/	",
	];
	
	let credits = [
		"===========================================",
		"         -=Written By Hagrid=-			    ",
		"     -=For CPRewritten and Pengur=-	    ",
		"===========================================",
		"\n"
	];

	console.log(chalk.hex('#6C198A').bold(logo.join("\n")));
	console.log(chalk.hex('#6C198A').bold(credits.join("\n")));
}

function getDateString() {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var date_string = util.format("%j:%j:%j - ", hours, minutes, seconds);
	
	return date_string;
}

function log(message, colour, newLine, newLineAfter, show) {
	if(message == null || colour == null || show == false) {
		return;
	}
	
	if(newLine) {
		console.log();
	}
	
	final_message = "log > " + getDateString() + message;
	console.log(chalk[colour].bold(final_message));
	
	if(newLineAfter) {
		console.log();
	}
}

function penguinLog(message, colour, nickname) {
	log('(' + nickname + ') > ' + message, colour);
}

function logHex(message, hex) {
	if(hex == null) {
		return;
	}
	
    final_message = "log > " + getDateString() + message;
    console.log(chalk.hex(hex)(final_message));
}

module.exports.log = log;
module.exports.penguinLog = penguinLog;
module.exports.logHex = logHex;
module.exports.getDateString = getDateString;
module.exports.start = start;