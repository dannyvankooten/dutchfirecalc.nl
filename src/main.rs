#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use] extern crate rocket;

mod simulator;
mod web;

fn main() {
    // let sim = simulator::new();
    // let success_ratio = sim.run(Vars{
    //     initial_capital: 1000000.00,
    //     initial_withdrawal: 40000.00,
    //     minimum_remaining: 0.00,
    //     yearly_fees: 0.15,
    //     years: 30,
    // });
    //
    //println!("Success ratio (30 years, 4% withdrawal rate, 0.15% fees): {}", success_ratio);

    web::run();
}
