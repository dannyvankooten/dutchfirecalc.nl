import React, { Component } from 'react'
import Plot from './Plot.js'
import Taxes from './Taxes.js'
import WithdrawalStrategies from './WithdrawalStrategies.js'
import Simulation from './Simulation.js'
import Format from './Format.js'
import * as Track from './Track.js'

function round (num, digits) {
  const exp = Math.pow(10, digits + 1)
  return (Math.round(num * exp) / exp).toFixed(digits)
}

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      initialCapital: 800000,
      initialSpending: 32000,
      initialMaxSpending: 48000,
      initialMinSpending: 28000,
      duration: 30, // years
      minimumRemaining: 0, // money
      pctFees: 0.15, // pct as provided by the user
      taxStrategy: Object.keys(Taxes)[0], // must exist on Taxes object,
      withDrawalStrategy: Object.keys(WithdrawalStrategies)[0], // must exist on WithdrawalStrategies object,
      id: '',
      simulations: 0,
      results: [],
      busy: false
    }

    this.runSimulation = this.runSimulation.bind(this)
  }

  componentDidMount () {
    Track.pageview()
  }

  runSimulation (evt) {
    evt.preventDefault()
    Track.event({
      category: 'User',
      action: 'Ran simulation'
    })

    const sim = new Simulation(this.state)
    let stop = false
    const runId = Math.random().toString()
    const batchSize = 60
    const tick = () => {
      // perform another batch of runs
      for (let i = 0; i < batchSize && !stop; i++) {
        stop = sim.run()
      }

      this.setState({
        summary: {
          max: sim.max,
          median: sim.median,
          successRate: sim.successful / sim.i,
          minLength: sim.minLength,
          medianMinMonths: sim.medianMinMonths,
          medianMaxMonths: sim.medianMaxMonths
        },
        results: sim.results,
        simulations: sim.i,
        currentPeriodStart: sim.currentPeriodStart(),
        currentPeriodEnd: sim.currentPeriodEnd(),
        busy: !stop,
        id: !stop ? runId : ''
      })

      // keep going
      if (!stop) {
        window.setTimeout(tick, 6)
      }
    }

    this.setState({
      summary: {
        max: 0,
        median: 0,
        successRate: null,
        minLength: 0
      },
      results: [],
      simulations: sim.i,
      busy: true,
      id: runId,
      currentPeriodStart: sim.currentPeriodStart(),
      currentPeriodEnd: sim.currentPeriodEnd()
    }, tick)
  }

  render () {
    return (
      <div className="container app">
        <h1>Dutch FIRE Calculator</h1>
        <p>This tool simulates portfolio performance using a yearly spending amount (adjusted for inflation), investment fees and real tax calculation.</p>
        <p>The simulation uses historical returns for the S&amp;P 500 with dividends re-invested, going back to 1871.</p>

        <form className="" onSubmit={this.runSimulation}>
          <div className="margin-m">
            <label>Initial capital</label>
            <input type="number" value={this.state.initialCapital} disabled={this.state.busy} onChange={e => this.setState({ initialCapital: parseInt(e.target.value) })} step="1000" min="0" />
          </div>
          <div className="margin-m">
            <label>Withdrawal strategy</label>
            <select onChange={e => this.setState({ withDrawalStrategy: e.target.value })} value={this.state.withdrawalStrategy} disabled={this.state.busy}>
              {Object.keys(WithdrawalStrategies).map(k => (<option key={k} value={k}>{k}</option>))}
            </select>
            <div>
              <small>{WithdrawalStrategies[this.state.withDrawalStrategy].description}</small>
            </div>
          </div>
          {this.state.withDrawalStrategy === 'SWR'
            ? (
              <div className="margin-m">
                <label>Initial yearly spending</label>
                <input type="number" value={this.state.initialSpending} disabled={this.state.busy} onChange={e => this.setState({ initialSpending: parseInt(e.target.value) })} step="100" min="0" />
                <div>
                  <small>(equals a withdrawal rate of {(this.state.initialSpending / this.state.initialCapital * 100).toFixed(1)}%)</small>
                </div>
              </div>
            ) : (
              <div>
                <div className="margin-m">
                  <label>Initial maximum yearly spending</label>
                  <input type="number" value={this.state.initialMaxSpending} disabled={this.state.busy} onChange={e => this.setState({ initialMaxSpending: parseInt(e.target.value) })} step="100" min="0" />
                  <div>
                    <small>(equals a withdrawal rate of {(this.state.initialMaxSpending / this.state.initialCapital * 100).toFixed(1)}%)</small>
                  </div>
                </div>
                <div className="margin-m">
                  <label>Initial minimum yearly spending</label>
                  <input type="number" value={this.state.initialMinSpending} disabled={this.state.busy} onChange={e => this.setState({ initialMinSpending: parseInt(e.target.value) })} step="100" min="0" />
                  <div>
                    <small>(equals a withdrawal rate of {(this.state.initialMinSpending / this.state.initialCapital * 100).toFixed(1)}%)</small>
                  </div>
                </div>
              </div>
            )
          }
          <div className="margin-m">
            <label>Duration <small>(years)</small></label>
            <input type="number" value={this.state.duration} disabled={this.state.busy} onChange={e => this.setState({ duration: parseInt(e.target.value) })} min="5" max="80" step="1" />
            <div>
              <small>How many years should the money last?</small>
            </div>
          </div>
          <div className="margin-m">
            <label>Minimum capital remaining</label>
            <input type="number" value={this.state.minimumRemaining} disabled={this.state.busy} onChange={e => this.setState({ minimumRemaining: parseInt(e.target.value) })} step="1000" min="0" />
            <div>
              <small>How much money should be left over at the end of the {this.state.duration} years.</small>
            </div>
          </div>
          <div className="margin-m">
            <label>Fees <small>(% per year)</small></label>
            <input type="number" value={this.state.pctFees} disabled={this.state.busy} onChange={e => this.setState({ pctFees: parseFloat(e.target.value) })} step="0.01" min="0.00" />
          </div>
          <div className="margin-m">
            <label>Tax strategy</label>
            <select onChange={e => this.setState({ taxStrategy: e.target.value })} value={this.state.taxStrategy} disabled={this.state.busy}>
              {Object.keys(Taxes).map(k => (<option key={k} value={k}>{k}</option>))}
            </select>
          </div>
          <div className="margin-m">
            <button type="submit" disabled={this.state.busy}>{this.state.busy ? 'Please wait' : 'Run simulation'}</button>
            {this.state.busy ? (<span className="l-margin-s small">&mdash; simulating {this.state.currentPeriodStart} - {this.state.currentPeriodEnd}</span>) : null}
          </div>
        </form>
        <div className="right">
          {this.state.results.length > 0
            ? (<div>
              <div className="margin-m">
                <p>This strategy had a success rate of <strong>{Format.percentage(this.state.summary.successRate)}</strong> out of {this.state.simulations} tested {this.state.duration} year periods.</p>
              </div>
              <div className="small">
                <ul className="summary">
                  {this.state.withDrawalStrategy === 'SWR'
                    ? (<li>The initial spending amount of <span>{Format.money(this.state.initialSpending)}</span> is adjusted for inflation each year.</li>)
                    : (<li>The initial spending amounts of <span>{Format.money(this.state.initialMinSpending)}</span> and <span>{Format.money(this.state.initialMaxSpending)}</span> are adjusted for inflation each year.</li>)}
                  {this.state.withDrawalStrategy === 'VWR'
                    ? (<li>In months where portfolio returns after taxes and withdrawal are less than <span>{Format.money(this.state.initialMaxSpending)}</span> for the past 12 months, withdrawal is set to an optimal level between <span>{Format.money(this.state.initialMaxSpending)}</span> and <span>{Format.money(this.state.initialMinSpending)}</span>.</li>) : ''}
                  <li>For our purposes, failure means the portfolio was depleted early, or the final portfolio balance was less than the set minimum capital left.</li>
                  <li>The highest portfolio balance at the end of your retirement was <span>{Format.money(this.state.summary.max)}</span> (not inflation adjusted).</li>
                  <li>The median portfolio balance at the end of your retirement was <span>{Format.money(this.state.summary.median)}</span> (not inflation adjusted).</li>
                  {this.state.withDrawalStrategy === 'VWR'
                    ? (<li>The median number of months spent withdrawing only the bare minimum was <span>{this.state.summary.medianMinMonths}</span> (<span>{round(this.state.summary.medianMinMonths / 12, 2)}</span> years)</li>) : ''}
                  {this.state.withDrawalStrategy === 'VWR'
                    ? (<li>The median number of months spent withdrawing the absolute maximum was <span>{this.state.summary.medianMaxMonths}</span> (<span>{round(this.state.summary.medianMaxMonths / 12, 2)}</span> years)</li>) : ''}
                  <li>In the worst period, this portfolio only lasted <span>{Math.round(this.state.summary.minLength / 12)}</span> years.</li>
                </ul>
              </div>
              <div className="margin-m">
                <Plot xMax={this.state.duration * 12} draw={!this.state.busy} datasets={this.state.results} id={this.state.id} />
              </div>
            </div>) : ''}
        </div>

      </div>
    )
  }
}

export default App
