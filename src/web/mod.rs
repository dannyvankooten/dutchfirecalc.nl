use rocket_contrib::templates::Template;
use rocket::response::NamedFile;
use rocket::State;
use rocket::request::{FromForm, Form};
use num_format::{Locale, ToFormattedString};
use rocket_contrib::templates::tera::{Context, Value, to_value, Error};
use serde::Serialize;
use std::path::PathBuf;
use std::path::Path;
use std::collections::HashMap;

use crate::simulator;

// TODO: This can probably be DRY'er?
#[derive(FromForm, Debug, Clone, Serialize)]
struct Params {
    capital: u64,
    withdrawal_min: u64,
    duration: usize,
    withdrawal_max: Option<u64>,
    fees: Option<f32>,
    minimum_remaining: Option<u64>,
    tax_strategy: Option<String>,
    heffingskorting: Option<bool>,
    fiscal_partner: Option<bool>,
}

impl Into<simulator::Vars> for Params {
    fn into(self) -> simulator::Vars {
        simulator::Vars {
           initial_capital: self.capital,
           initial_withdrawal_min: self.withdrawal_min,
           initial_withdrawal_max: self.withdrawal_max.unwrap_or(self.withdrawal_min),
           yearly_fees: self.fees.unwrap_or(0.00),
           minimum_remaining: self.minimum_remaining.unwrap_or(0),
           years: self.duration,
           tax_strategy: self.tax_strategy.unwrap_or(String::from("")),
           with_fiscal_partner: self.fiscal_partner.unwrap_or(false),
           with_heffingskorting: self.heffingskorting.unwrap_or(false),
           aow_amount: 0,
           aow_start_year: 0,
        }
    }
}

#[get("/")]
fn index() -> Template {
    let context = Context::new();
    Template::render("index", &context)
}


#[get("/sim?<params..>")]
fn sim(sim: State<simulator::Simulator>, params : Form<Params>) -> Template {
    let params = params.into_inner();
    let results = sim.run(params.clone().into());

    let mut context = Context::new();
    context.insert("params", &params);
    context.insert("success_ratio", &results.success_ratio);
    context.insert("median", &results.median());
    context.insert("tail", &results.tail(5));
    context.insert("head", &results.head(5));
    context.insert("samples", &results.periods.len());
    return Template::render("sim", &context);
}



#[get("/<file..>")]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("public/").join(file)).ok()
}

pub fn run() {
    // create simulator instance
    let simulator = simulator::new();

    // boot rocket server
    rocket::ignite()
        .mount("/", routes![index, files, sim])
        .attach(Template::custom(|engines| {
            engines.tera.register_filter("money", format_money)
         }))
        .manage(simulator)
        .launch();
}

fn format_money(v: Value, _params: HashMap<String, Value>) -> Result<Value, Error> {
    match v.as_u64() {
        Some(i) => Ok(to_value(i.to_formatted_string(&Locale::en)).unwrap()),
        _ => Ok(v)
    }
}