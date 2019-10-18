export default {

    'safe withdrawal rate': {
		getInitialMinWithDrawal : (config) => { return config.initialSpending / 12 },
		getInitialMaxWithDrawal : (config) => { return config.initialSpending / 12 },
		//(gains, costs, taxes, withDrawalMin, withDrawalMax);
		calculateWithdrawal : (gains, costs, taxes, withDrawalMin, withDrawalMax) => {
			return withDrawalMin; // Doesn't matter, both min and max are the same.
		}
	},

    'variable withdrawal rate (capital preservation)': {
		getInitialMinWithDrawal : (config) => { return config.initialMinSpending / 12 },
		getInitialMaxWithDrawal : (config) => { return config.initialMaxSpending / 12 },
		calculateWithdrawal : (gains, costs, taxes, withDrawalMin, withDrawalMax) => {
			return Math.max(Math.min(gains - costs - taxes, withDrawalMax), withDrawalMin)
		}
	},

    'variable withdrawal rate (cut negatives)': {
		getInitialMinWithDrawal : (config) => { return config.initialMinSpending / 12 },
		getInitialMaxWithDrawal : (config) => { return config.initialMaxSpending / 12 },
		calculateWithdrawal : (gains, costs, taxes, withDrawalMin, withDrawalMax) => {
			return gains < 0 ? withDrawalMin : withDrawalMax;
		}
	}
};