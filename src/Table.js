import React, { Component } from 'react';


class Table extends Component {
    render() {
        if (!this.props.datasets || this.props.datasets.length === 0) {
            return null;
        }

        const header = (<tr><th>Start</th>{this.props.datasets[0].map((d, i) => (<th key={i}>{i.toString()}</th>))}</tr>)
        const rows = this.props.datasets.map((d, i) => {
            return (<tr key={i.toString()}><th>{i}</th>{d.map((v, i) => <td key={i}>{v}</td>)}</tr>);
        });

        return (
            <table>
                <thead>{header}</thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        )
    }
}

export default Table;
