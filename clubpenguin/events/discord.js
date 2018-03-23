var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var EventEmitter = require('events');

require('./post.js');

/* Webhook Service */

webhookUrls = {
	'buyers-log': '',
	'coin-log': '',
	'staff-log': '',
	'coinsforchange': ''
};

WebhookEvent = new EventEmitter();

function baseLog(data, mention = true) {
	var _data = [];
	
	for(var key in data) {
		var value = data[key];
		var string = `*${key}*: **${value}**`;
		
		_data.push(string);
	}
	
	_data = _data.join('|\n');
	
	var message = ` ~~                                                                   ~~\n${_data}\n`;
	
	if(mention) {
		message += `<@180656781276610560>`;
	}
	
	return message;
}

WebhookEvent.on('buyers-log', (array) => {
	var message = baseLog(array);
	var username = 'Buyers Log';
	var url = webhookUrls['buyers-log'];
	
	PostEvent.emit('PostRequest', url, {'username': username, 'content': message});
});

WebhookEvent.on('staff-log', (array) => {
	var message = baseLog(array);
	var username = 'Staff Log';
	var url = webhookUrls['staff-log'];
	
	PostEvent.emit('PostRequest', url, {'username': username, 'content': message});
});

WebhookEvent.on('coin-log', (array) => {
	var message = baseLog(array);
	var username = 'Coin Log';
	var url = webhookUrls['coin-log'];
	
	PostEvent.emit('PostRequest', url, {'username': username, 'content': message});
});

WebhookEvent.on('coinsforchange', (array) => {
	var message = baseLog(array, false);
	var username = 'Donation Log';
	var url = webhookUrls['coinsforchange'];
	
	PostEvent.emit('PostRequest', url, {'username': username, 'content': message});
});

module.exports.webhookUrls = webhookUrls;
module.exports.WebhookEvent = WebhookEvent;