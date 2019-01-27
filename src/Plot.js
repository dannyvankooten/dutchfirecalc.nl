import React, { Component } from 'react';
import * as d3 from 'd3';
import './Plot.css';

class Plot extends Component {
    constructor(props) {
        super(props);

        this.base = React.createRef();
    }

    componentDidMount() {
        this.init();
    }

    componentWillReceiveProps(nextProps) {
        // do nothing if id is empty
        if (nextProps.id === '') {
            return;
        }
        
        // should we redraw the entire chart?
        if (nextProps.id !== this.props.id) {
            this.reset();
        }

        this.draw(nextProps.datasets);
    }

    init(){
        const margin = {top: 20, right: 20, bottom: 40, left: 70};
        this.ctx = d3.select(this.base.current)
        this.ctx.selectAll('*').remove();
        this.width = Math.min(window.innerWidth - 40, 860) - margin.left - margin.right;
        this.height = Math.min(350, this.width / 1.5) - margin.top - margin.bottom;

        this.ctx = this.ctx
            .attr("width", this.width + margin.left + margin.right)
            .attr("height", this.height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        this.xMin = 0;
        this.xMax = this.props.xMax;
        this.yMin = 0;
        this.yMax = 0;
        this.x = d3.scaleLinear().range([0, this.width]).domain([this.xMin, this.xMax])
        this.y = d3.scaleLinear().range([this.height, 0])
        this.line = d3.line().x((d, i) => this.x(i))
        this.xScale = d3.scaleLinear().range([0, this.width]).domain([this.xMin, this.xMax/12])
        this.yAxis = d3.axisLeft().scale(this.y)
        this.xAxis = d3.axisBottom().scale(this.xScale).ticks(this.xMax/12)
        
        // limit number of ticks on small screens
        if (this.width < 600) {
            this.xAxis.ticks(3)
            this.yAxis.ticks(3)
        }

        this.yGrid = d3.axisLeft().scale(this.y).tickSize(-this.width).tickFormat("")
        this.xGrid = d3.axisBottom().scale(this.xScale).ticks(this.xMax/12).tickSize(this.height).tickFormat("")
        
        this.ctx.append("g")
            .attr("class", "x axis")
            .attr('transform', 'translate(0,' + (this.height) + ')')

        this.ctx.append("g")
            .attr("class", "y axis")

        this.ctx.append("g").attr("class", "grid x")
        this.ctx.append("g").attr("class", "grid y")

        // 0 line
        this.ctx.append("line").attr("class", 'zero-line')    
        this.lines = [];
        this.domainHash = '';
    }

    reset() {
        this.init();
    }

    draw(datasets) {
        const last = datasets[this.lines.length];
        this.yMin = Math.min(this.yMin, d3.min(last))
        this.yMax = Math.max(this.yMax, d3.max(last))
        const domainHash = `${this.xMin},${this.xMax},${this.yMin},${this.yMax}`
        const diff = this.domainHash !== domainHash;
        const graph = this.ctx;
        
        if (diff) {
            //this.x = this.x 
            this.y = this.y.domain([this.yMin, this.yMax])
            this.line = this.line.y((d, i) => this.y(d))
            this.yAxis = this.yAxis.scale(this.y)
            //this.xAxis = this.xAxis
           
            graph.select('.y.axis').call(this.yAxis);
            graph.select('.x.axis').call(this.xAxis)
            graph.select(".zero-line")
                .attr("x1", 0) .attr("y1", this.y(0)).attr("x2", this.x(360)).attr("y2",  this.y(0))
                .attr('stroke-width', 2)

            // add the X gridlines
            graph.select('.x.grid').call(this.yGrid)

            // // add the Y gridlines
            graph.select('.y.grid').call(this.xGrid)    
        }
        
        // draw (or update) graph lines when browser sees fit
        let i = 0;
        let drawLine = () => {
            if(this.lines[i]) {
                // only update this line if something important in the graph dimensions changed
                if(diff) {
                    this.lines[i].attr('d', this.line(datasets[i]))
                }
            } else {
                // draw new line
                this.lines[i] = graph.append('path')
                    .attr("class", "data-line l"+i)
                    .attr('d', this.line(datasets[i]))
                    .attr('stroke', () => "hsl(" + (Math.random() * 360) + ",100%,50%)")
            }
            i++;

            if (i < datasets.length) {
                window.requestAnimationFrame(drawLine);
            }
        }

        window.requestAnimationFrame(drawLine);   
    }

    render() {
        return (
            <svg className="plot" ref={this.base}></svg>
        )
    }
}

export default Plot;
