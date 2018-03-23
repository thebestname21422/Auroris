var logger = require('../../util/logger.js');
var network = require('../../util/network.js');

/* Holiday - holiday# */
module.exports = function() {
	this.limitedAmount = 100000; //donation limit per login session
	this.amountTypes = [100, 500, 1000, 5000, 10000];
	this.charities = {
		2: {'name': 'Building Homes For Children', charityId: 1},
		3: {'name': 'Protect The Earth', charityId: 2},
		1: {'name': 'Provide Medical Help', charityId: 3}
	};

	this.startDependency = function() {
	}
	
	this.donateCoinsForChange = function(penguin, data) {
		if(isNaN(data[0]) || isNaN(data[1])) {
			return;
		}
		
		var amountType = Number(data[0]);
		var categoryId = Number(data[1]);
		
		if(amountTypes.indexOf(amountType) == -1) {
			return;
		}
		
		if(charities[categoryId] == undefined) {
			return;
		}
		
		if((penguin.donateTotal + amountType) > limitedAmount) {
			return;
		}
		
		if(amountType > penguin.coins) {
			return; //not enough coins
		}
		
		penguin.donateTotal += amountType;
		penguin.subtractCoins(amountType);
		
		WebhookEvent.emit('coinsforchange', {
			'Charity ID': charities[categoryId].charityId,
			'Charity Type': charities[categoryId].name,
			'Coin Amount': amountType,
			'Penguin Name': penguin.name(),
			'Penguin Total': penguin.donateTotal
		});
		
		penguin.database.getDonationsTotal(function(total) {
			if(isNaN(total)) {
				return;
			}
			
			var charity = charities[categoryId].charityId;
			
			penguin.database.getCharityById(charity, function(totalCharity) {
				penguin.database.updateCharityTotal(charity, (Number(totalCharity) + amountType));
				penguin.database.updateDonationsTotal((Number(total) + Number(amountType)));
				
				penguin.send('dc', penguin.room.internal_id, penguin.coins);
			});
		});
	}
}