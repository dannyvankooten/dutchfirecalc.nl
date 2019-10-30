import Taxes from './Taxes.js';

it('calculates taxes correctly', () => {
    const tests = [
        {
            // https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/belasting_betalen_over_uw_vermogen/grondslag_sparen_en_beleggen/berekening-2019/voorbeeld-alleenstaande-met-spaargeld
            strategy: 'vermogensbelasting 2019',
            input: [130360, 0],
            output: 794,
        },
        {

            strategy: 'vermogensbelasting 2017',
            input: [125000, 0],
            output: 990,
        },
        {
            // https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/belasting_betalen_over_uw_vermogen/grondslag_sparen_en_beleggen/berekenen_belasting_over_uw_inkomsten_uit_vermogen_vanaf_2017/voorbeeld-alleenstaande-met-125.000-euro-spaargeld
            strategy: 'vermogensbelasting 2017',
            input: [1250000, 0],
            output: 17108,
        },
        {
            // https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/vermogen_en_aanmerkelijk_belang/vermogen/belasting_betalen_over_uw_vermogen/grondslag_sparen_en_beleggen/berekening-2018/Voorbeeld-alleenstaande-met-spaargeld
            strategy: 'vermogensbelasting 2018',
            input: [130000, 0],
            output: 807,
        },
        {
            strategy: 'vermogensbelasting 2018',
            input: [1255000, 0],
            output: 16189,
        },
        {
            strategy: 'tax free',
            input: [1255000, 0],
            output: 0,
        },
        {
            strategy: 'vennootschapsbelasting 2019',
            input: [1000000, 10000],
            output: 1900,
        }
    ]

    tests.forEach(t => {
        expect(Taxes[t.strategy](...t.input)).toBe(t.output);
    })
});
