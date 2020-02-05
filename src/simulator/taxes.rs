pub fn vermogensbelasting_2020(capital: f32, _gains: f32) -> f32 {
    let capital = capital - 30846.0;
    if capital < 0.00 {
      return 0.00;
    }

    let schijf_1 = (capital.min(72798.0) * 0.01799).floor();
    let schijf_2 = ((0.00 as f32).max(capital.min(1005573.0) - 72798.0) * 0.04223).floor();
    let schijf_3 = ((0.00 as f32).max(capital - 1005573.0) * 0.0533).floor();
    return (0.00 as f32).max((schijf_1 + schijf_2 + schijf_3) * 0.30).floor();
}

pub fn tax_free(_capital: f32, _gains: f32) -> f32 {
    0.00
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_tax_free() {
        assert_eq!(tax_free(0.00, 0.00), 0.00);
        assert_eq!(tax_free(100.00, 100.00), 0.00);
    }

    #[test]
    fn test_vermogensbelasting_2020() {
        assert_eq!(vermogensbelasting_2020(0.00, 0.00), 0.00);
        assert_eq!(vermogensbelasting_2020(25000.00, 0.00), 0.00);

        // https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/belasting_betalen_over_uw_vermogen/grondslag_sparen_en_beleggen/berekening-2020/voorbeeld-alleenstaande-met-spaargeld
        assert_eq!(vermogensbelasting_2020(150000.00, 100.00), 979.00);
    }
}