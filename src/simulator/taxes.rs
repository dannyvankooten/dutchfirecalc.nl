pub fn vermogensbelasting_2020(capital: f32, _gains: f32, _with_partner: bool, _with_heffingskorting: bool) -> f32 {
    let capital = if _with_partner { capital / 2.0 } else { capital } - 30_846.0;
    if capital < 0.00 {
      return 0.00;
    }

    let schijf_1 = (capital.min(72_798.0) * 0.01789).floor();
    let schijf_2 = ((0.00 as f32).max(capital.min(1_005_573.0) - 72_798.0) * 0.04185).floor();
    let schijf_3 = ((0.00 as f32).max(capital - 1_005_573.0) * 0.0528).floor();
    let heffingskorting = if _with_heffingskorting { 2_711.00 } else { 0.00 };
    let schijven = schijf_1 + schijf_2 + schijf_3;
    let tax = (0.00 as f32).max((schijven * 0.30).floor() - heffingskorting);
    return if _with_partner { tax * 2.0 } else { tax };
}

pub fn vermogensbelasting_2022(capital: f32, _gains: f32, _with_partner: bool, _with_heffingskorting: bool) -> f32 {
  let belastingvrije_voet = if _with_partner { 30_846.00 * 2.0 } else { 30_846.00 };
  if capital < belastingvrije_voet {
      return 0.00;
  };

  let belastingvrij_rendement = if _with_partner { 400.0 * 2.0 } else { 400.00 };
  return (0.00 as f32).max(0.33 * (0.0533 * capital - belastingvrij_rendement).floor()).floor();
}

pub fn tax_free(_capital: f32, _gains: f32, _with_partner: bool, _with_heffingskorting: bool) -> f32 {
    0.00
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_tax_free() {
        assert_eq!(tax_free(0.00, 0.00, false, false), 0.00);
        assert_eq!(tax_free(100.00, 100.00, false, false), 0.00);
    }

    #[test]
    fn test_vermogensbelasting_2020() {
        assert_eq!(vermogensbelasting_2020(0.00, 0.00, false, false), 0.00);
        assert_eq!(vermogensbelasting_2020(25_000.00, 0.00, false, false), 0.00);
        assert_eq!(vermogensbelasting_2020(50_000.00, 0.00, false, false), 102.00);
        assert_eq!(vermogensbelasting_2020(100_000.00, 0.00, false, false), 371.00);


        // https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/belasting_betalen_over_uw_vermogen/grondslag_sparen_en_beleggen/berekening-2020/voorbeeld-alleenstaande-met-spaargeld
        assert_eq!(vermogensbelasting_2020(150_000.00, 100.00, false, false), 972.00);
        assert_eq!(vermogensbelasting_2020(1_000_000.00, 0.00, false, false), 11_644.00);
        
        // https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/belasting_betalen_over_uw_vermogen/grondslag_sparen_en_beleggen/berekening-2020/voorbeeld-u-hebt-spaargeld-met-uw-fiscale-partner-en-geeft-ieder-de-helft-van-de-grondslag-op
        assert_eq!(vermogensbelasting_2020(261_692.00, 100.00, true, false), 1_464.00);
    }

    #[test]
    fn test_vermogensbelasting_2022() {
        assert_eq!(vermogensbelasting_2022(0.00, 0.00, false, false), 0.00);
        assert_eq!(vermogensbelasting_2022(25_000.00, 0.00, false, false), 0.00);
        assert_eq!(vermogensbelasting_2022(50_000.00, 0.00, false, false), 747.00);
        assert_eq!(vermogensbelasting_2022(1_000_000.00, 100.00, false, false), 17_457.00);
        assert_eq!(vermogensbelasting_2022(5_000_000.00, 100.00, false, false), 87_813.00);
    }
}
