var logger = require('../../util/logger.js');
var network = require('../../util/network.js');

/* Toy - t# */
module.exports = function() {
	this.startDependency = function() {
	}

	this.openPlayerBook = function(penguin, data) {
		penguin.room.send(penguin, 'at', penguin.room.internal_id, penguin.id, 1, 1);
	}
	
	this.closePlayerBook = function(penguin, data) {
		penguin.room.send(penguin, 'rt', penguin.room.internal_id, penguin.id);
	}
}