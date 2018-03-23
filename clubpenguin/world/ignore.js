var logger = require('../../util/logger.js');
var network = require('../../util/network.js');

/* Ignore - n# */
module.exports = function() {
	this.startDependency = function() {
	}

    this.getIgnores = function(penguin, data) {
		/*if(penguin.ignores.length == 0) {
			return penguin.send('gn', -1);
		}
		
		let ignoreList = [];
		
		for(var index in penguin.ignores) {
			var playerId = index;
			var playerNickname = penguin.ignores[playerId];
			
			ignoreList.push(playerId + '|' + playerNickname);
		}
		
		return penguin.send('gn', -1, ignoreList.join('%'));*/
		return penguin.send('gn', -1);
    }
}
