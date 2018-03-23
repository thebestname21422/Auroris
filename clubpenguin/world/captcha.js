var logger = require('../../util/logger.js');
var network = require('../../util/network.js');

require('./navigation.js')();
require('../events/post.js');

/* Captcha - captcha# */
module.exports = function() {
	this.verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
	this.privateKey = '';

	this.startDependency = function() {
	}
	
	this.verifyCaptchaToken = function(penguin, data) {
		if(penguin.joined) { //already joined
			return;
		}
		
		if(!penguin.joinedServer) { //hasn't joined server
			return;
		}
		
		var token = data[0];
		var builtUrl = (verifyUrl + '?secret=' + privateKey + '&response=' + token);
		
		PostEvent.emit('GetRequest', builtUrl, function(response) {
			var response = JSON.parse(response);
			
			if(response['success'] !== true) {
				penguin.send('e', -1, 101);
				return network.removePenguin(penguin);
			}
			
			penguin.send('captchasuccess', -1);
			
			handleJoinWorld(penguin);
		});
	}
}