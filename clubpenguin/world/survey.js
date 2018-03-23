const logger = require('../../util/logger.js');
const network = require('../../util/network.js');
const range = require("range").range;

/* Survey - survey# */
module.exports = function() {
	this.playIndexes = ['squidzoid', 'ruby', 'goldpuffle', 'fairy', 'underwater'];
	this.awardIndexes = ['BestPlay', 'BestCostume', 'BestMusic', 'BestEffects', 'BestSet'];

	this.startDependency = function() {
	}

	this.checkHasVoted = function(penguin, data) {
		penguin.send('hasvoted', penguin.room.internal_id, penguin.hasVoted);
	}

	this.playAwards = function(penguin, data) {
		let vote = data;

		if(vote.length !== 5) return;
		if(penguin.hasVoted == 1) return;

		for(index in vote) {
			let award = vote[index];
			let awardArr = award.split(',').map(Number);
			let awardName = awardIndexes[index];

			if(awardArr.length !== 5) return; //spoof
			if(awardArr.filter(a => a == 1).length > 1) return; //> 1 category

			let _index = awardArr.indexOf(1);
			let playVote = playIndexes[_index];

			penguin.database.update_column(penguin.id, awardName, playVote);

			logger.log('{0} was voted for {1}'.format(playVote, awardName), 'green');
		}

		penguin.hasVoted = 1;
		penguin.database.update_column(penguin.id, 'Voted', 1);
	}

	return this;
}