var logger = require('../../util/logger.js');
var network = require('../../util/network.js');

/* EPF - f# */
module.exports = function() {
	this.startDependency = function() {
	}

	this.getAgentStatus = function(penguin, data) {
		if(penguin.EPF !== undefined && penguin.joined == true) {
			penguin.send('epfga', -1, penguin.EPF['status']);
		}
	}
	
	this.setAgentStatus = function(penguin, data) {
		if(penguin.EPF == undefined || penguin.joined == false) {
			return;
		}
		
		if(Number(penguin.EPF['status']) == 1) { //already an agent wot?
			return;
		}
		
		penguin.EPF['status'] = 1;
		
		var epfRow = [penguin.EPF['status'], penguin.EPF['points'], penguin.EPF['career']].join(',');
		
		penguin.database.update_column(penguin.id, 'EPF', epfRow);
		penguin.send('epfsa', -1, 1);
	}
	
	this.getFieldStatus = function(penguin, data) {
		if(penguin.EPF !== undefined && penguin.joined == true) {
			penguin.send('epfgf', -1, penguin.EPF['field']);
		}
	}
	
	this.setFieldStatus = function(penguin, data) {
		if(penguin.EPF == undefined || penguin.joined == false) {
			return;
		}
		
		var status = data[0];
		var fieldMedals = 5;
		
		if(isNaN(status) || status > 2) {
			return;
		}
		
		penguin.EPF['field'] = Number(status);
		penguin.database.update_column(penguin.id, 'FieldStatus', penguin.EPF['field']);
		
		if(penguin.EPF['field'] == 2) {
			penguin.EPF['points'] += fieldMedals;
			penguin.EPF['career'] += fieldMedals;
			
			var epfRow = [penguin.EPF['status'], penguin.EPF['points'], penguin.EPF['career']].join(',');
			
			penguin.database.update_column(penguin.id, 'EPF', epfRow);
		}
		
		penguin.send('epfsf', penguin.room.internal_id, penguin.EPF['field']);
	}
	
	this.getAgentRank = function(penguin, data) {
		if(penguin.EPF !== undefined && penguin.joined == true) {
			penguin.send('epfgr', -1, penguin.EPF['career'], penguin.EPF['points']);
		}
	}
	
	this.grantReward = function(penguin, data) {
		var rewardInt = data[0];
		
		if(isNaN(rewardInt) || rewardInt > 46) {
			return;
		}
		
		penguin.EPF['points'] += Number(rewardInt);
		
		var epfRow = [penguin.EPF['status'], penguin.EPF['points'], penguin.EPF['career']].join(',');
		
		penguin.database.update_column(penguin.id, 'EPF', epfRow);
		penguin.send('epfgrantreward', penguin.room.internal_id, penguin.EPF['points']);
	}
	
	this.purchaseSpyGear = function(penguin, data) {
		var itemId = data[0];
		
		if(isNaN(itemId)) {
			return;
		}
		
		if(global.epfItems[Number(itemId)] == undefined) {
			return penguin.send('e', penguin.room.internal_id, 402);
		}
		
		if(penguin.EPF['points'] < global.epfItems[Number(itemId)][0]) {
			return penguin.send('e', penguin.room.internal_id, 405);
		}
		
		if(penguin.inventory.indexOf(Number(itemId)) >= 0) { //if in inventory
			return penguin.send('e', penguin.room.internal_id, 400);
		}
		
		penguin.EPF['points'] -= global.epfItems[Number(itemId)][0];
		
		var epfRow = [penguin.EPF['status'], penguin.EPF['points'], penguin.EPF['career']].join(',');
		
		penguin.database.update_column(penguin.id, 'EPF', epfRow);
		penguin.inventory.push(itemId);
		
		penguin.database.update_column(penguin.id, 'Inventory', penguin.inventory.join('%'), (function(result) {
			penguin.send('epfai', penguin.room.internal_id, penguin.EPF['points']);
        }).bind(this));
	}

	return this;
}