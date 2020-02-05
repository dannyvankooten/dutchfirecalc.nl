
use std::fs;

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

// TODO: Add support for taxes
// TODO: Add support for variable withdrawals
pub struct Vars {
    pub initial_capital: f32,
    pub initial_withdrawal: f32,
    pub minimum_remaining: f32,
    pub yearly_fees: f32,
    pub years: usize,
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
    pub fn run(&self, vars : Vars) -> f32 {
        let months = vars.years * 12;
        let samples = self.data.len() - months;
        let fees_pct = vars.yearly_fees / 12.00 / 100.00;
        let mut succeeded = 0;
        let mut gains : f32;
        let mut fees : f32;
        for p in 0..samples {
            let mut capital = vars.initial_capital;
            let mut withdrawal = vars.initial_withdrawal / 12.00;
            let month_start_index = p;
            let month_end_index = p + (vars.years * 12);
            for month in month_start_index..month_end_index {
                withdrawal = withdrawal + withdrawal * self.data[month].inflation;
                gains = capital * self.data[month].roi;
                fees = fees_pct * capital;

                capital = capital + gains - fees - withdrawal;              

                if capital < 0.0 {
                    break;
                }
            }

            if capital > vars.minimum_remaining {
                succeeded = succeeded + 1;
            }
        }

        let success_ratio = succeeded as f32 / samples as f32 * 100.00;

        // TODO: What to return here? What do we want to visualise?
        return success_ratio;
    }
}

pub fn new() -> Simulator {
    let data : Vec<Month> = parse_data_file().windows(2).map(|r| {
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

fn parse_data_file() -> Vec<CsvRow> {
    let input = fs::read_to_string("data.csv").unwrap();
    let dataset : Vec<CsvRow> = input.lines()
        .skip(1) // skip heading
        .map(|l| {
            let data : Vec<&str> = l.split_terminator(",").collect();
                
            CsvRow{
                date: data[0].to_owned(),
                price: data[1].to_owned().parse::<f32>().unwrap(),
                dividend: data[2].to_owned().parse::<f32>().unwrap(),
                //earnings: data[3].to_owned().parse::<f32>().unwrap(),
                cpi: data[4].to_owned().parse::<f32>().unwrap(),
                //cape: data[5].to_owned().parse::<f32>().unwrap(),
            }
        }).collect();

    dataset
}