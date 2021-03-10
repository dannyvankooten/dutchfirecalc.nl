#![feature(proc_macro_hygiene, decl_macro)]
#![feature(slice_partition_at_index)]

#[macro_use]
extern crate rocket;

mod simulator;
mod web;

fn main() {
    // let sim = simulator::new();
    // let results = sim.run(simulator::Vars{
    //     initial_capital: 1000000,
    //     initial_withdrawal_min: 40000,
    //     initial_withdrawal_max: 40000,
    //     minimum_remaining: 0,
    //     yearly_fees: 0.15,
    //     years: 30,
    //     tax_strategy: "".to_string(),
    //     aow_amount: 0.00,
    //     aow_starts_after_x_years: 0,
    //     with_fiscal_partner: false,
    //     with_heffingskorting: false,
    // });
    
    // println!("Success ratio (30 years, 4% withdrawal rate, 0.15% fees): {}", results.success_ratio);

   web::run();
}
