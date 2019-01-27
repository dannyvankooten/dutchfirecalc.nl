import Format from './Format.js';

it('formats money', () => {
    expect(Format.money(0.00)).toBe('€0')
    expect(Format.money(1000.00)).toBe('€1,000')
    expect(Format.money(1000000.00)).toBe('€1,000,000')
});
  
it('formats percentages', () => {
    expect(Format.percentage(0.00)).toBe('0.00%')
    expect(Format.percentage(1.00)).toBe('100.00%')
    expect(Format.percentage(1.00, 0)).toBe('100%')
});
  