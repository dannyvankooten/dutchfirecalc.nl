
use std::fs;

mod taxes;

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
    pub initial_withdrawal_min: f32,
    pub initial_withdrawal_max: f32,
    pub minimum_remaining: f32,
    pub yearly_fees: f32,
    pub years: usize,
    pub tax_strategy: Option<String>,
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
        let tax_fn = match vars.tax_strategy.unwrap_or(String::from("tax free")).as_str() {
            "vermogensbelasting 2020" => taxes::vermogensbelasting_2020,
            "tax free" | "" | _=> taxes::tax_free,
        };

        // run over each available sample
        for p in 0..samples {
            let mut capital = vars.initial_capital;
            let mut withdrawal_min = vars.initial_withdrawal_min / 12.00;
            let mut withdrawal_max = vars.initial_withdrawal_max / 12.00;
            let mut withdrawal : f32;
            let mut taxes : f32;
            let month_start_index = p;
            let month_end_index = p + months;

            // run over each month 
            for month in month_start_index..month_end_index {
                // adjust withdrawal values for inflation
                withdrawal_min = withdrawal_min + withdrawal_min * self.data[month].inflation;
                withdrawal_max = withdrawal_max + withdrawal_max * self.data[month].inflation;

                // calculate capital gains (price increase + dividends)
                gains = capital * self.data[month].roi;

                // calculate fees
                fees = fees_pct * capital;
                
                // determine amount to withdraw
                withdrawal = if capital < vars.initial_capital { withdrawal_min } else { withdrawal_max };

                // calculate taxes
                taxes = if month % 12 == 0 { tax_fn(capital, gains) } else { 0.00 };
                
                // calculate new capital value
                capital = capital + gains - fees - taxes - withdrawal;              

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