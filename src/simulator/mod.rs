
use std::fs;
use std::convert::TryInto;
use std::cmp::Ordering;
use serde::Serialize;
use chrono::prelude::*;

mod taxes;

pub struct Vars {
    pub initial_capital: u64,
    pub initial_withdrawal_min: u64,
    pub initial_withdrawal_max: u64,
    pub minimum_remaining: u64,
    pub yearly_fees: f32,
    pub years: usize,
    pub tax_strategy: String,
    pub with_heffingskorting: bool,
    pub with_fiscal_partner: bool,
    pub aow_amount: u64,
    pub aow_start_year: usize, 
}

#[derive(Serialize, Eq, Clone)]
pub struct Period {
    pub duration: usize,
    pub end_capital: u64,
    pub date_start: String,
    pub date_end: String,
}

impl PartialEq for Period {
    fn eq(&self, other: &Self) -> bool {
        self.duration == other.duration && self.end_capital == other.end_capital
    }
}

impl PartialOrd for Period {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Period {
    fn cmp(&self, other: &Self) -> Ordering {
        if self.end_capital > other.end_capital {
            Ordering::Greater
        } else if self.end_capital == other.end_capital {
            if self.duration > other.duration {
                Ordering::Greater
            } else {
                Ordering::Less
            }
        } else {
            Ordering::Less
        }
    }
}


pub struct Results {
    pub success_ratio : f32,
    pub periods: Vec<Period>,
}

impl Results {
    pub fn new(mut results: Vec<Period>, successful_runs: usize) -> Results {
         // sort end capitals & durations (in reverse)
         results.sort_unstable_by(|a, b| b.cmp(a));

         return Results{
             success_ratio: successful_runs as f32 / results.len() as f32 * 100.0,
             periods: results,
         }
    }

    pub fn median(&self) -> u64 {
        let size = self.periods.len();
        if size % 2 == 0 {
            return (self.periods[size / 2 - 1].end_capital + self.periods[size / 2].end_capital) / 2;
        }
        
        return self.periods[size / 2].end_capital;
    }

    pub fn tail<'a> (&'a self, n : usize) -> Vec<Period> {
        let mut iter = self.periods.rchunks(n);
        let chunk = iter.next().unwrap();
        let mut chunk = chunk.to_vec();
        chunk.reverse();
        return chunk;
    }

    pub fn head(&self, n : usize) -> &[Period] {
        let mut iter = self.periods.chunks(n);
        return iter.next().unwrap();
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
            "vermogensbelasting 2021" => taxes::vermogensbelasting_2021,
            "vermogensbelasting 2022" => taxes::vermogensbelasting_2022,
            _=> taxes::tax_free,
        };
        let mut successful_runs : usize = 0;
        let mut results : Vec<Period> = Vec::with_capacity(samples);
        let initial_capital = vars.initial_capital as f32;
        let withdrawal_min = vars.initial_withdrawal_min as f32 / 12.00;
        let withdrawal_max = vars.initial_withdrawal_max as f32 / 12.00;
        let mut withdrawal : f32;
        let mut taxes : f32;
        let mut gains : f32;
        let mut fees : f32;
        let aow_start_month : usize = if vars.aow_start_year > 0 && vars.aow_amount > 0 { 
            let local: DateTime<Local> = Local::now();
            ((vars.aow_start_year as isize - local.year() as isize) * 12).try_into().unwrap_or(0)
        } else { 0 };

        // run over each available sample
        for p in 0..samples {
            let mut capital = initial_capital;
            let mut cum_inflation = 1.00;
            let mut duration = 0;

            for i in 0..months {
                // adjust withdrawal values for inflation
                cum_inflation *= 1.0 + self.data[p+i].inflation;

                // calculate capital gains (price increase + dividends)
                gains = capital * self.data[p+i].roi;

                // calculate fees
                fees = fees_pct * capital;
                
                // determine amount to withdraw
                withdrawal = if capital < initial_capital { withdrawal_min * cum_inflation } else { withdrawal_max * cum_inflation };

                // calculate taxes every 12th month
                taxes = if i % 12 == 0 { tax_fn(capital, gains, vars.with_fiscal_partner, vars.with_heffingskorting) } else { 0.00 };
                
                // calculate new capital value
                capital = capital + gains - fees - taxes - withdrawal;          
                
                // add AOW
                if aow_start_month > 0 && i >= aow_start_month {
                    capital += vars.aow_amount as f32
                }

                if capital <= 0.0 {
                    break;
                }

                duration += 1;
            }
          
            // adjust end capital for inflation
            let end_capital = (capital.max(0.00) / cum_inflation) as u64;

            // run succeeded if we have more money left than intended 
            if end_capital > vars.minimum_remaining {
                successful_runs += 1;
            }
            
            results.push(Period{
                end_capital: end_capital,
                duration: duration,
                date_start: self.data[p].date.to_owned(),
                date_end: self.data[p].date.to_owned(),
            });
        }

        return Results::new(results, successful_runs);
    }
}

pub fn new() -> Simulator {
    let data : Vec<Month> = CsvRow::from_file("public/data.csv").windows(2).map(|r| {
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
}

#[derive(Debug)]
struct Month {
    roi : f32,
    inflation : f32,
    date: String,
}

impl CsvRow {
    fn parse_date(d : &str) -> String {
        let mut parts = d.split_terminator('.');
        let year = parts.next().unwrap();
        let month = parts.next().unwrap();
        let month = match month {
            "1" => "10",
            _ => month,
        };

        return format!("{}-{}", year, month);
    }

    fn from_file<P: AsRef<std::path::Path>>(path: P) -> Vec<CsvRow> {
        let input = fs::read_to_string(path).unwrap();
        let dataset : Vec<CsvRow> = input.lines()
            .skip(1) // skip heading
            .map(|l| {
                let data : Vec<&str> = l.split_terminator(',').collect();
                    
                CsvRow{
                    date: Self::parse_date(data[0]),
                    price: data[1].to_owned().parse::<f32>().unwrap(),
                    dividend: data[2].to_owned().parse::<f32>().unwrap_or(0.0),
                    cpi: data[4].to_owned().parse::<f32>().unwrap(),
                }
            }).collect();

        dataset
    }
}

#[cfg(test)] 
mod test {
    use super::*;

    #[test]
    fn test_simulator_run() {
        let sim = new();
        let results = sim.run(Vars{
            initial_capital: 100,
            initial_withdrawal_min: 4,
            initial_withdrawal_max: 4,
            yearly_fees: 0.00,
            tax_strategy: String::new(),
            years: 30,
            minimum_remaining: 0,
            with_fiscal_partner: false,
            with_heffingskorting: false,
            aow_amount: 0,
            aow_start_year: 0,
        });

        // better way would be to use a test specific dataset
        assert_eq!(results.success_ratio > 95.0, true);
        assert_eq!(results.success_ratio < 99.0, true);

        // anoter obvious one
        let results = sim.run(Vars{
            initial_capital: 100,
            initial_withdrawal_min: 0,
            initial_withdrawal_max: 0,
            yearly_fees: 0.00,
            tax_strategy: String::new(),
            years: 30,
            minimum_remaining: 0,
            with_fiscal_partner: false,
            with_heffingskorting: false,
            aow_amount: 0,
            aow_start_year: 0,
        });
        assert_eq!(results.success_ratio, 100.0);
    }

    #[test]
    fn test_aow() {
        let now: DateTime<Local> = Local::now();
        let sim = new();
        let results = sim.run(Vars{
            initial_capital: 100,
            initial_withdrawal_min: 50,
            initial_withdrawal_max: 50,
            yearly_fees: 0.00,
            tax_strategy: String::new(),
            years: 10,
            minimum_remaining: 0,
            with_fiscal_partner: false,
            with_heffingskorting: false,
            aow_amount: 50,
            aow_start_year: (now.year() + 1) as usize,
        });

        assert_eq!(results.success_ratio, 100.0);
    }


    #[test]
    fn test_results() {
        let periods = vec![
            Period{
                duration: 30,
                end_capital: 400,
                date_start: String::new(),
                date_end: String::new(),
            },
            Period{
                duration: 30,
                end_capital: 100,
                date_start: String::new(),
                date_end: String::new(),
            },
            Period{
                duration: 30,
                end_capital: 900,
                date_start: String::new(),
                date_end: String::new(),
            }
        ];
        let results = Results::new(periods, 3);
        assert_eq!(results.median(), 400);
        assert_eq!(results.head(1)[0].end_capital, 900);
        assert_eq!(results.head(10)[0].end_capital, 900);
        assert_eq!(results.tail(1)[0].end_capital, 100);
        assert_eq!(results.tail(10)[0].end_capital, 100);
    }


    #[test]
    fn test_parse_date() {
        assert_eq!(CsvRow::parse_date("2019.01"), "2019-01");
        assert_eq!(CsvRow::parse_date("2019.02"), "2019-02");

        // this happens because of copying the dataset from XLS -> CSV
        assert_eq!(CsvRow::parse_date("2019.1"), "2019-10");
        assert_eq!(CsvRow::parse_date("2019.11"), "2019-11");
        assert_eq!(CsvRow::parse_date("2019.12"), "2019-12");

    }
}