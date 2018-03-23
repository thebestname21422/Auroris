var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var request = require('request');
var EventEmitter = require('events');

/* Post Service */

PostEvent = new EventEmitter();

PostEvent.on('PostRequest', (url, body, callback) => {
	try {
		let options = {
			uri: url,
			method: 'POST',
			json: body
		}
		request(options, function(error, response, body) {
			if(error) {
				logger.log('error: ' + error, 'red');
				
				if(typeof(callback) == 'function') {
					return callback(false);
				}
			} else {
				if(typeof(callback) == 'function') {
					return callback(body);
				}
			}
		});
	} catch(error) {
		logger.log(error, 'red');
		return callback(false);
	}
});

PostEvent.on('GetRequest', (url, callback) => {
	try {
		let options = {
			uri: url,
			method: 'GET',
		}
		request(options, function(error, response, body) {
			if(error) {
				logger.log('error: ' + error, 'red');
				
				if(typeof(callback) == 'function') {
					return callback(false);
				}
			} else {
				if(typeof(callback) == 'function') {
					return callback(body);
				}
			}
		});
	} catch(error) {
		logger.log(error, 'red');
		return callback(false);
	}
});

module.exports.PostEvent = PostEvent;