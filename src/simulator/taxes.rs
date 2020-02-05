pub fn vermogensbelasting_2020(capital: f32, gains: f32) -> f32 {
    // TODO
    0.00
}

pub fn tax_free(capital: f32, gains: f32) -> f32 {
    0.00
}

#[cfg(test)]
mod test {
    #[test]
    fn test_tax_free() {
        assert_eq!(tax_free(), 0.00);
    }
}