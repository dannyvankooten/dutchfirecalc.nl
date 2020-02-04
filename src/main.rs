mod simulator;

fn main() {
    println!("Hello, world!");

    let sim = simulator::new();
    sim.run();
}
