import React, { Component } from 'react';
import './App.css';

import Plot from './Plot.js';
//import Table from './Table.js';
import Taxes from './Taxes.js';
import Simulation from './Simulation.js';

const formatter = new Intl.NumberFormat('en-US', {
 style: 'currency',
 currency: 'EUR',
 minimumFractionDigits: 0,
});


class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            initialCapital: 800000,
            initialSpending: 32000,
            duration: 30, // years
            pctFees: 0.15, // pct as provided by the user
            taxStrategy: Object.keys(Taxes)[0],
            id: '',
            results: [],
            simulations: 0,
            best: null,
            worst: null,
            successRate: null,
            busy: false,            
        }
    }

    runSimulation(evt) {
        evt.preventDefault();

        let sim = new Simulation(this.state)
        this.setState({
            successRate: null,
            results: [], 
            simulations: sim.i,
            busy: true,
            id: Math.random(0, 1).toString(),
            currentPeriodStart: sim.currentPeriodStart(),
            currentPeriodEnd: sim.currentPeriodEnd(),
        })

        let tick = () => {
            // check if user canceled
            if (!this.state.busy) {
                return;
            }

            sim.run()
            let state = {
                best: sim.best,
                worst: sim.worst,
                successRate: sim.successful / sim.i,
                results: sim.results,
                simulations: sim.i,
                currentPeriodStart: sim.currentPeriodStart(),
                currentPeriodEnd: sim.currentPeriodEnd(),
            }
            this.setState(state)

            if (!sim.done()) {
                window.requestAnimationFrame(tick);   
            }
        }

        window.requestAnimationFrame(tick);   
    }

    stopSimulation(evt) {
        this.setState({
            id: '',
            busy: false,
        })
    }

    render(props) {
        return (
            <div className="container app">
                <h1>DutchFire Calculator</h1>
                <form className="" onSubmit={this.runSimulation.bind(this)}>
                    <div className="margin-m">
                        <label>Initial capital</label>
                        <input type="number" value={this.state.initialCapital} disabled={this.state.busy} onChange={e => this.setState({initialCapital: parseInt(e.target.value)})} step="1000" min="0" />
                    </div>
                    <div className="margin-m">
                        <label>Initial yearly spending</label>
                        <input type="number" value={this.state.initialSpending} disabled={this.state.busy} onChange={e => this.setState({initialSpending: parseInt(e.target.value)})} step="100" min="0" /> 
                        <div>
                            <small >(equals a withdrawal rate of {(this.state.initialSpending / this.state.initialCapital* 100).toFixed(1)}%</small>
                        </div>
                    </div>
                    <div className="margin-m">
                        <label>Duration <small>(years)</small></label>
                        <input type="number" value={this.state.duration} disabled={this.state.busy} onChange={e => this.setState({duration: parseInt(e.target.value)})}  min="0" step="1" />
                        
                    </div>
                    <div className="margin-m">
                        <label>Fees <small>(% per year)</small></label>
                        <input type="number" value={this.state.pctFees} disabled={this.state.busy} onChange={e => this.setState({pctFees: parseFloat(e.target.value)})} step="0.01" min="0.00" />
                    </div>
                    <div className="margin-m">
                        <label>Tax strategy</label>
                        <select onChange={e => this.setState({taxStrategy: e.target.value })} value={this.state.taxStrategy} disabled={this.state.busy}>
                            {Object.keys(Taxes).map(k => (<option key={k} value={k}>{k}</option>))}
                        </select>
                    </div>
                    <div className="margin-m">
                        {this.state.busy ? ( 
                            <span>
                                <button type="button" className="" onClick={this.stopSimulation.bind(this)}>Stop simulation</button>
                                <span className="l-margin-s small">&mdash; simulating {this.state.currentPeriodStart} - {this.state.currentPeriodEnd}</span>
                            </span>
                        ) : (<button type="submit">Run simulation</button>)}
                    </div>
                </form>
               <div className="right">
                {this.state.results.length > 0 ? 
                    (<div>
                        <div className="margin-m">
                            <p>This strategy had a success rate of <strong>{(this.state.successRate * 100).toFixed(2)}%</strong> out of {this.state.simulations} tested {this.state.duration} year periods.</p>
                        </div>
                        <div className="margin-m">
                            <Plot xMax={this.state.duration * 12} yMax={this.state.best} yMin={this.state.worst} datasets={this.state.results} id={this.state.id} />
                        </div>
                        <div className="small">
                            <ul>
                                <li>The initial spending amount of {formatter.format(this.state.initialSpending)} is adjusted for inflation each year.</li>
                                <li>For our purposes, failure means the portfolio was depleted before the end of the {this.state.duration} year period.</li>
                                <li>The lowest and highest portfolio balance at the end of your retirement was <span>{formatter.format(this.state.worst)}</span> and <span>{formatter.format(this.state.best)}</span> respectively (not inflation adjusted).</li>
                            </ul>
                        </div>
                    </div>) : ''}
                </div>

            </div>
        );
    }
}

export default App;
