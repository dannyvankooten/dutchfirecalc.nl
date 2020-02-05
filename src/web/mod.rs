use rocket_contrib::templates::Template;
use rocket::response::NamedFile;
use rocket::request::{FromForm, Form};

use rocket_contrib::templates::tera::Context;
use serde::Serialize;

use std::path::PathBuf;
use std::path::Path;

use crate::simulator;

// TODO: This can probably be DRY'er?
#[derive(FromForm, Debug, Clone, Serialize)]
struct Params {
    capital: f32,
    withdrawal_min: f32,
    withdrawal_max: f32,
    fees: f32,
    minimum_remaining: f32,
    tax_strategy: String,
    duration: usize,
}

impl Into<simulator::Vars> for Params {
    fn into(self) -> simulator::Vars {
        simulator::Vars {
           initial_capital: self.capital,
           initial_withdrawal_min: self.withdrawal_min,
           initial_withdrawal_max: self.withdrawal_max,
           yearly_fees: self.fees,
           minimum_remaining: self.minimum_remaining,
           years: self.duration,
           tax_strategy: Some(self.tax_strategy),
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
    let result = sim.run(params.clone().into());

    context.insert("params", &params);
    context.insert("result", &result);
    Template::render("sim", &context)
}

#[get("/<file..>")]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("public/").join(file)).ok()
}

pub fn run() {
    rocket::ignite()
        .mount("/", routes![index, files, sim])
        .attach(Template::fairing())
        .launch();
}