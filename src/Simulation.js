import { DataFrame } from 'pandas-js'
import rawData from "./data.csv.js"
import * as d3 from 'd3'
import 'd3-dsv'
import Taxes from './Taxes.js'
import math from 'mathjs';
import WithdrawalStrategies from './WithdrawalStrategies.js'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
const data = d3.csvParse(rawData, r => ({
    Date: r.Date.replace('.', '-'),
    P: parseFloat(r.P),
    D: parseFloat(r.D),
    E: parseFloat(r.E),
    CPI: parseFloat(r.CPI),
    CAPE: r.CAPE,
}))

let df = new DataFrame(data)
df = df.set('Stock yield', df.get('P').pct_change())
df = df.set('Dividend yield', (df.get('D').divide(df.get('P'))).divide(12))
df = df.set('Yield', df.get('Stock yield').add(df.get('Dividend yield')))
df = df.set('Inflation', df.get('CPI').pct_change().add(1))
window.df = df    

const inflationSeries = df.get("Inflation")
const yieldSeries = df.get("Yield")
const dateLast = new Date(df.get("Date").iloc(df.length-1))

class Simulation {
    results = []
    endResults = []
    numMinMonths = []
    medianMinMonths = 0
    numMaxMonths = []
    medianMaxMonths = 0
    successful = 0
    i = 0
    max = 0
    median = 0

    constructor(config) {        
        this.months = config.duration * 12
        this.initialCapital = config.initialCapital
        this.ocf = config.pctFees / 12 / 100;
        this.samples = yieldSeries.length - this.months - 2 // don't ask...
        this.taxFunction = Taxes[config.taxStrategy]
        this.minLength = this.months
        
        this.withdrawalStrategy = WithdrawalStrategies[config.withDrawalStrategy];    
        this.initialMinWithdrawal = this.withdrawalStrategy.getInitialMinWithDrawal(config);
        this.initialMaxWithdrawal = this.withdrawalStrategy.getInitialMaxWithDrawal(config);
    }

    run() {
        let capital = this.initialCapital
        let withDrawalMin = this.initialMinWithdrawal;
        let withDrawalMax = this.initialMaxWithdrawal;
        let r = [capital]
        let gains = 0
        let taxes = 0
        let costs = 0 
        let untaxedGains = 0
        let carryForward = 0
        let numMonthsWithMinimumWithdrawal = 0
        let numMonthsWithMaximumWithdrawal = 0
        let pos
        const calculateTaxes = typeof(this.taxFunction) === "function"
        
        let month = 1
        for( true; month <= this.months; month++) {
            pos = this.samples - this.i + month; // we start at the most recent period and then work our way down
            costs = this.ocf * capital;
            withDrawalMin = inflationSeries.iloc(pos) * withDrawalMin;
            withDrawalMax = inflationSeries.iloc(pos) * withDrawalMax;
            gains = yieldSeries.iloc(pos) * capital;
            untaxedGains = untaxedGains + gains
          
            // calculate taxes every 12 months
            if (month % 12 === 0 && calculateTaxes) {
                taxes = this.taxFunction(capital, untaxedGains, carryForward);

                // calculate losses to carry forward to next tax cycle 
                carryForward = Math.min(0, carryForward + untaxedGains)
                untaxedGains = 0;
            } else {
                taxes = 0;
            }

            // calculate capital after changes
            let withDrawal = this.withdrawalStrategy.calculateWithdrawal(r, gains, costs, taxes, withDrawalMin, withDrawalMax);
            if(withDrawal === withDrawalMin) {
                numMonthsWithMinimumWithdrawal++;
            }
            else if(withDrawal === withDrawalMax) {
                numMonthsWithMaximumWithdrawal++;
            }
            
            capital = capital + gains - costs - taxes - withDrawal;

            // did we reach EOL?
            if (capital < 0) {
                capital = 0
                r[month] = 0
                break;
            } else {
                // store rounded capital amount in run results
                r[month] = capital
            }
        }

        // store results
        r.startDate = this.currentPeriodStart()
        r.endDate = this.currentPeriodEnd()
        this.results[this.i] = r;
        this.endResults[this.i] = capital
        this.median = math.median(this.endResults)
        this.numMinMonths[this.i] = numMonthsWithMinimumWithdrawal
        this.medianMinMonths = math.median(this.numMinMonths)
        this.numMaxMonths[this.i] = numMonthsWithMaximumWithdrawal
        this.medianMaxMonths = math.median(this.numMaxMonths)

        if (capital > this.max) {
            this.max = capital
        }

        if (month < this.minLength) {
            this.minLength = month;
        }

        // recompute success rate
        if (capital > 0) {
            this.successful++;
        }
        
        // increment index & signal whether we're done or not
        this.i++;
        return this.done()
    }

    done() {
        return this.i >= this.samples
    }

    currentPeriodStart() {
        let d = new Date(dateLast)
        d.setMonth(dateLast.getMonth() - this.i - this.months)
        return monthNames[d.getMonth()] + ' ' + d.getFullYear() 
    }

    currentPeriodEnd() {
        let d = new Date(dateLast)
        d.setMonth(dateLast.getMonth() - this.i)
        return monthNames[d.getMonth()] + ' ' + d.getFullYear() 
    }

}

export default Simulation;