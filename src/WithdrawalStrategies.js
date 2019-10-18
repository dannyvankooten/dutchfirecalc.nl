export default {

    'SWR': {
		description: "Fixed inflation-adjusted withdrawal every month.",

		getInitialMinWithDrawal : (config) => { return config.initialSpending / 12 },
		getInitialMaxWithDrawal : (config) => { return config.initialSpending / 12 },
		calculateWithdrawal : (results, gains, costs, taxes, withDrawalMin, withDrawalMax) => {
			return withDrawalMin; // Doesn't matter, both min and max are the same.
		}
	},

    'VWR': { // TODO: Better naming
		description: "Variable withdrawal rate. Between minimum and maximum if result of trailing 12 months is less than maximum.", // TODO: Better explanation.

		getInitialMinWithDrawal : (config) => { return config.initialMinSpending / 12 },
		getInitialMaxWithDrawal : (config) => { return config.initialMaxSpending / 12 },
		calculateWithdrawal : (results, gains, costs, taxes, withDrawalMin, withDrawalMax) => {
			let initialCapital = results[0];
			let lastCapital = results[results.length - 1];
			if(initialCapital <= lastCapital) { // Don't worry if you have more than enough...
				return withDrawalMax
			}
			
			let trailing_11 = results.slice(-11, results.length);
			let result_trailing_11 = trailing_11[trailing_11.length - 1] - trailing_11[0]
			let avg_result_trailing_12_min = (result_trailing_11 + gains - costs - taxes - withDrawalMin) / (trailing_11.length + 1)
			if(avg_result_trailing_12_min < withDrawalMin) { // Past 12 months returns are less than minimum? Use minimum.
				return withDrawalMin
			}
			
			let avg_result_trailing_12_max = (result_trailing_11 + gains - costs - taxes - withDrawalMax) / (trailing_11.length + 1)
			if(avg_result_trailing_12_max > withDrawalMax) {// Past 12 months returns are more than maximum? Use minimum.
				return withDrawalMax
			}

			// In all other cases... find a way to smooth back to using the maximum.
			if(avg_result_trailing_12_min < withDrawalMax) {
				return avg_result_trailing_12_min;
			}
			
			if(avg_result_trailing_12_max > withDrawalMin) {
				return avg_result_trailing_12_max;
			}
			
			return (avg_result_trailing_12_min + avg_result_trailing_12_max) / 2;
		}
	}
};