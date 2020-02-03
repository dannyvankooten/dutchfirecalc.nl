const numberFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0
})

const Format = {
  money: v => {
    return numberFormatter.format(v)
  },

  percentage: (v, decimals) => {
    return (v * 100.00).toFixed(typeof (decimals) === 'number' ? decimals : 2) + '%'
  }
}

export default Format
