import { DataFrame } from 'pandas-js';
import rawData from "./data.csv.js";
import * as d3 from 'd3';
import 'd3-dsv';
import Taxes from './Taxes.js';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const data = d3.csvParse(rawData, r => ({
    Date: r.Date.replace('.', '-'),
    P: parseFloat(r.P),
    D: parseFloat(r.D),
    E: parseFloat(r.E),
    CPI: parseFloat(r.CPI),
    CAPE: r.CAPE,
}))

let df = new DataFrame(data);
df = df.set('Stock yield', df.get('P').pct_change())
df = df.set('Dividend yield', (df.get('D').divide(df.get('P'))).divide(12))
df = df.set('Yield', df.get('Stock yield').add(df.get('Dividend yield')))
df = df.set('Inflation', df.get('CPI').pct_change().add(1))
window.df = df;     

const dateLast = new Date(df.get("Date").iloc(df.length-1)); 

class Simulation {
    constructor(config) {        
        this.months = config.duration * 12;
        this.initialCapital = config.initialCapital;
        this.initialWithdrawal = config.initialSpending / 12;
        this.ocf = config.pctFees / 12 / 100;
        this.samples = df.length - this.months - 1;
        this.results = [];
        this.i = 0;
        this.successful = 0;
        this.best = 0;
        this.worst = 0;
        this.taxFunction = Taxes[config.taxStrategy];
    }

    run() {
        let r = [];
        let capital = this.initialCapital;
        let withdrawal = this.initialWithdrawal;
        let gains = 0, 
            taxes = 0, 
            costs = 0, 
            untaxedGains = 0,
            carryForward = 0;
        let inflationSeries = df.get("Inflation")
        let yieldSeries = df.get("Yield")
        let pos;

        for(let month=0; month < this.months; month++) {
            pos = this.samples - this.i + month; // we start at the most recent period and then work our way down
            costs = this.ocf * capital;
            withdrawal = withdrawal * inflationSeries.iloc(pos);
            gains = yieldSeries.iloc(pos) * capital;
            untaxedGains += gains

            // calculate taxes every 12 months
            if (month % 12 === 0 && typeof(this.taxFunction) === "function") {
                taxes = this.taxFunction(capital, untaxedGains);
                untaxedGains = 0;
            } else {
                taxes = 0;
            }
            
            // calculate capital after changes
            capital = parseInt(capital + gains - costs - taxes - withdrawal);

            // store rounded capital amount in run results
            r[month] = capital;
        }

        // store results
        r.start = this.currentPeriodStart(); // to help debug
        this.results[this.i] = r;

        // increment index
        this.i++;

        // recompute success rate
        if (capital > 0) {
            this.successful++;
        }

        // recompute best & worst stats
        if (capital > this.best)  {
            this.best = capital;
        } else if (capital < this.worst) {
            this.worst = capital;
        }

        // if capital capital is obscenely high, write to log...
        if (capital > (this.initialCapital * this.months / 12)) {
            console.log(this.currentPeriodStart(), " claims a high capital of ", capital, " index ", this.i);
        }

        return r;
    }

    done() {
        return this.i >= this.samples;
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