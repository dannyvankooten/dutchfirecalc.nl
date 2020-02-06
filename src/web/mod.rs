use rocket_contrib::templates::Template;
use rocket::response::NamedFile;
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
    withdrawal_max: Option<u64>,
    fees: f32,
    minimum_remaining: u64,
    tax_strategy: String,
    duration: usize,
}

impl Into<simulator::Vars> for Params {
    fn into(self) -> simulator::Vars {
        simulator::Vars {
           initial_capital: self.capital,
           initial_withdrawal_min: self.withdrawal_min,
           initial_withdrawal_max: self.withdrawal_max.unwrap_or(self.withdrawal_min),
           yearly_fees: self.fees,
           minimum_remaining: self.minimum_remaining,
           years: self.duration,
           tax_strategy: self.tax_strategy,
        }
    }
}

#[get("/")]
fn index() -> Template {
    let context = Context::new();
    Template::render("index", &context)
}

#[get("/sim?<params..>")]
fn sim(params : Form<Params>) -> Template {
    let params = params.into_inner();
    let mut context = Context::new();
    let sim = simulator::new();
    let results = sim.run(params.clone().into());

    context.insert("params", &params);
    context.insert("success_ratio", &results.success_ratio);
    context.insert("median", &results.median());
    context.insert("tail", &results.tail(5));
    context.insert("head", &results.head(5));
    context.insert("samples", &results.periods.len());
    Template::render("sim", &context)
}

#[get("/<file..>")]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("public/").join(file)).ok()
}

pub fn run() {
    rocket::ignite()
        .mount("/", routes![index, files, sim])
        .attach(Template::custom(|engines| {
            engines.tera.register_filter("money", format_money)
         }))
        .launch();
}

fn format_money(v: Value, _params: HashMap<String, Value>) -> Result<Value, Error> {
    match v.as_u64() {
        Some(i) => Ok(to_value(i.to_formatted_string(&Locale::en)).unwrap()),
        _ => Ok(v)
    }
}