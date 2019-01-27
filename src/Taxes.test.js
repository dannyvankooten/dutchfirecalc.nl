import Taxes from './Taxes.js';

it('calculates taxes correctly', () => {
    const tests = [
        { 
            strategy: 'vermogensbelasting 2017',
            input: [125000, 0],
            output: 991,
        },
        { 
            strategy: 'vermogensbelasting 2017',
            input: [1250000, 0],
            output: 17108,
        },
        { 
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

