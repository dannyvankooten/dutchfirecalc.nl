use chrono::Datelike;
use num_format::{Locale, ToFormattedString};
use rocket::request::{Form, FromForm};
use rocket::response::NamedFile;
use rocket::State;
use rocket_contrib::templates::tera::{to_value, Context, Error, Value};
use rocket_contrib::templates::Template;
use serde::Serialize;
use std::collections::HashMap;
use std::path::Path;
use std::path::PathBuf;

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
    aow_amount: Option<f64>,
    aow_start_year: Option<usize>,
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
            aow_amount: self.aow_amount.unwrap_or(0.00),
            aow_starts_after_x_years: match self.aow_start_year {
                None => 0,
                Some(y) => {
                    let year = chrono::Local::now().year() as usize;
                    if y > year {
                        y - year
                    } else {
                        0
                    }
                }
            },
        }
    }
}

#[get("/")]
fn index() -> Template {
    let context = Context::new();
    Template::render("index", &context)
}

#[get("/sim?<params..>")]
fn sim(sim: State<simulator::Simulator>, params: Form<Params>) -> Template {
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
            engines.tera.register_filter("money", format_money);
            engines.tera.register_filter("years", format_years);
        }))
        .manage(simulator)
        .launch();
}

fn format_money(v: Value, _params: HashMap<String, Value>) -> Result<Value, Error> {
    match v.as_u64() {
        Some(i) => Ok(to_value(i.to_formatted_string(&Locale::en)).unwrap()),
        _ => Ok(v),
    }
}

fn format_years(v: Value, _params: HashMap<String, Value>) -> Result<Value, Error> {
    match v.as_f64() {
        Some(i) => Ok(to_value(i.round() as u64).unwrap()),
        _ => Ok(v),
    }
}
