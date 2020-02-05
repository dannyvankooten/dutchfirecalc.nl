
use std::fs;
use serde::Serialize;
use std::cmp::{min, max};

mod taxes;

pub struct Vars {
    pub initial_capital: u64,
    pub initial_withdrawal_min: u64,
    pub initial_withdrawal_max: u64,
    pub minimum_remaining: u64,
    pub yearly_fees: f32,
    pub years: usize,
    pub tax_strategy: String,
}

#[derive(Serialize)]
pub struct Period {
    pub duration: usize,
    pub end_capital: u64,
    pub date_start: String,
    pub date_end: String,
}

pub struct Results {
    pub success_ratio : f32,
    pub periods: Vec<Period>,
}

impl Results {
    pub fn median(&self) -> u64 {
        let size = self.periods.len();
        if size % 2 == 0 {
            return (self.periods[size / 2 - 1].end_capital + self.periods[size / 2].end_capital) / 2;
        } else {
            return self.periods[size/2].end_capital;
        }
    }

    pub fn tail(&self, n : usize) -> &[Period] {
        let start = max(self.periods.len() - n, 0);
        return &self.periods[start..];
    }

    pub fn head(&self, n : usize) -> &[Period] {
        let end = min(self.periods.len(), n);
        return &self.periods[0..end];
    }
}

// TODO: Optionally we can use builder pattern like this for specifying simulation variables
// impl Vars {
//     pub fn new() -> Self {
//         Vars {
//             initial_capital: 1000000.00,
//             initial_withdrawal: 0.00,
//             minimum_remaining: 0.00,
//             yearly_fees: 0.00,
//             years: 30
//         }
//     }
//     pub fn capital(&mut self, v : f32) -> &Self {
//         self.initial_capital = v;
//         self
//     }
// }

pub struct Simulator{
    data: Vec<Month>
}

impl Simulator {
    pub fn run(&self, vars : Vars) -> Results {
        let months = vars.years * 12;
        let samples = self.data.len() - months;
        let fees_pct = vars.yearly_fees / 12.00 / 100.00;
        let tax_fn = match vars.tax_strategy.as_str() {
            "vermogensbelasting 2020" => taxes::vermogensbelasting_2020,
            "tax free" | "" | _=> taxes::tax_free,
        };
        let mut successful_runs : usize = 0;
        let mut results : Vec<Period> = Vec::with_capacity(samples);
        let initial_capital = vars.initial_capital as f32;

        // run over each available sample
        for p in 0..samples {
            let mut capital = initial_capital;
            let mut withdrawal_min = vars.initial_withdrawal_min as f32 / 12.00;
            let mut withdrawal_max = vars.initial_withdrawal_max as f32 / 12.00;
            let mut withdrawal : f32;
            let mut taxes : f32;
            let mut gains : f32;
            let mut fees : f32;
            let month_start_index = p;
            let month_end_index = p + months;

            // run over each month 
            let mut month = month_start_index;
            while month < month_end_index {
                // adjust withdrawal values for inflation
                withdrawal_min = withdrawal_min + withdrawal_min * self.data[month].inflation;
                withdrawal_max = withdrawal_max + withdrawal_max * self.data[month].inflation;

                // calculate capital gains (price increase + dividends)
                gains = capital * self.data[month].roi;

                // calculate fees
                fees = fees_pct * capital;
                
                // determine amount to withdraw
                withdrawal = if capital < initial_capital { withdrawal_min } else { withdrawal_max };

                // calculate taxes every 12th month
                taxes = if month % 12 == 0 { tax_fn(capital, gains) } else { 0.00 };
                
                // calculate new capital value
                capital = capital + gains - fees - taxes - withdrawal;              

                if capital <= 0.0 {
                    break;
                }

                month = month + 1;
            }

            let end_capital = capital.max(0.00) as u64;

            // store end capital in results array
            results.push(Period{
                end_capital: end_capital,
                duration: month - month_start_index,
                date_start: self.data[month_start_index].date.to_owned(),
                date_end: self.data[month_end_index].date.to_owned(),
            });

            if end_capital > vars.minimum_remaining {
                successful_runs = successful_runs + 1;
            }
        }

        // sort end capitals
        results.sort_unstable_by(|a, b| b.end_capital.cmp(&a.end_capital));

        return Results{
            success_ratio: successful_runs as f32 / samples as f32 * 100.0,
            periods: results,
        }
    }
}

pub fn new() -> Simulator {
    let data : Vec<Month> = CsvRow::from_file("data.csv").windows(2).map(|r| {
        let price_change = r[1].price / r[0].price - 1.00;
        let inflation_change = r[1].cpi / r[0].cpi - 1.00;
        let div_yield = r[1].dividend / r[1].price / 12.00;

        return Month{
            date: r[1].date.to_owned(),
            roi: price_change + div_yield,
            inflation: inflation_change,
        };
    }).collect();

    Simulator {
        data
    }
}


#[derive(Debug)]
struct CsvRow {
    date: String,
    price : f32,
    dividend: f32,
    cpi: f32,
    //earnings: f32,
    //cape: f32
}

#[derive(Debug)]
struct Month {
    roi : f32,
    inflation : f32,
    date: String,
}

impl CsvRow {
    fn from_file<P: AsRef<std::path::Path>>(path: P) -> Vec<CsvRow> {
        let input = fs::read_to_string(path).unwrap();
        let dataset : Vec<CsvRow> = input.lines()
            .skip(1) // skip heading
            .map(|l| {
                let data : Vec<&str> = l.split_terminator(",").collect();
                    
                CsvRow{
                    // ugly but cheap date parsing
                    date: data[0].replace(".", "-").replace("-1", "-01").replace("-011", "-11").replace("-012", "-12").to_owned(),
                    price: data[1].to_owned().parse::<f32>().unwrap(),
                    dividend: data[2].to_owned().parse::<f32>().unwrap(),
                    //earnings: data[3].to_owned().parse::<f32>().unwrap(),
                    cpi: data[4].to_owned().parse::<f32>().unwrap(),
                    //cape: data[5].to_owned().parse::<f32>().unwrap(),
                }
            }).collect();

        dataset
    }
}
