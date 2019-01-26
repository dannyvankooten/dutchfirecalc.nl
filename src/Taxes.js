const Taxes = {
    'tax free': (capital, gains) => {
        return 0;
    },

    'vermogensbelasting 2018': (capital, gains) => {
        capital = capital - 30000;
        if (capital < 0) {
            return 0;
        }

        const schijf_1 = Math.min(70800, capital)
        const schijf_2 = Math.max(Math.min(978000, capital) - 70800, 0)
        const schijf_3 = Math.max(capital - 978000, 0)
        return Math.max(0, Math.round((0.02017 * schijf_1 + 0.04326 * schijf_2 + 0.0538 * schijf_3) * 0.30))    },

    'vermogensbelasting 2017': (capital, gains) => {
        capital = capital - 25000;
        if (capital < 0) {
            return 0;
        }

        const schijf_1 = Math.min(75000, capital)
        const schijf_2 = Math.max(Math.min(975000, capital) - 75000, 0)
        const schijf_3 = Math.max(capital - 975000, 0)
        return Math.max(0, Math.round((0.02871 * schijf_1 + 0.04600 * schijf_2 + 0.0539 * schijf_3) * 0.30))
    },

    'vermogensbelasting 2016': (capital, gains) => {
        return Math.max(0, Math.round(0.012 * ( capital - (2*24437))));
    },

    'vennootschapsbelasting 2019': (capital, gains) => {
        if (gains < 0) {
            return 0;
        }

        const schijf_1 = Math.max(Math.min(200000, gains), 0)
        const schijf_2 = Math.max(gains - 200000, 0)
        return Math.max(Math.round(0.19 * schijf_1 + 0.24 * schijf_2), 0)
    },
    'vennootschapsbelasting 2020': (capital, gains) => {
        if (gains < 0) {
            return 0;
        }
        
        const schijf_1 = Math.max(Math.min(200000, gains), 0)
        const schijf_2 = Math.max(gains - 200000, 0)
        return Math.max(Math.round(0.175 * schijf_1 + 0.225 * schijf_2), 0)
    },
    'vennootschapsbelasting 2021': (capital, gains) => {
        if (gains < 0) {
            return 0;
        }
        
        const schijf_1 = Math.max(Math.min(200000, gains), 0)
        const schijf_2 = Math.max(gains - 200000, 0)
        return Math.max(Math.round(0.16 * schijf_1 + 0.21 * schijf_2), 0)
    },
}

console.assert(Taxes['vermogensbelasting 2017'](125000, 0) === 991, "Incorrect tax logic");
console.assert(Taxes['vermogensbelasting 2017'](1250000, 0) === 17108, "Incorrect tax logic");
console.assert(Taxes['vermogensbelasting 2018'](130000, 0) === 807, "Incorrect tax logic");
console.assert(Taxes['vermogensbelasting 2018'](1255000, 0) === 16189, "Incorrect tax logic");

export default Taxes;