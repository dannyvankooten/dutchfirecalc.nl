
use std::fs;

#[derive(Debug)]
struct CsvRow {
    date: String,
    price : f32,
    dividend: f32,
    //earnings: f32,
    cpi: f32,
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
    initial_capital: u64,
    minimum_remaining: u64,
    yearly_fees: f32,
    years: u8,
}

pub struct Simulator{
    data: Vec<Month>
}


impl Simulator {
    pub fn run(&self) {
        println!("{:?}", self.data[self.data.len()-1]);
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