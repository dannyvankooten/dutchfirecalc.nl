import React, { Component } from 'react';
import * as d3 from "d3";
import d3Tip from "d3-tip";

import './Plot.css';

class Plot extends Component {
    constructor(props) {
        super(props);

        this.base = React.createRef();
        this.draw = this.draw.bind(this)
    }

    componentDidMount() {
        this.init();
    }

    componentDidUpdate(prevProps) {
        // do nothing if id is empty
        if (this.props.id === '') {
            return;
        }
        
        // should we redraw the entire chart?
        if (this.props.id !== prevProps.id) {
            this.reset();
        }

        if(this.props.draw) {
            window.requestAnimationFrame(this.draw)
        }
    }

    init(){
        const margin = {top: 20, right: 20, bottom: 40, left: 70};
        this.ctx = d3.select(this.base.current.firstChild)
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
        this.xAxis = d3.axisBottom().scale(this.xScale)

        this.yGrid = d3.axisLeft().scale(this.y).tickSize(-this.width).tickFormat("")
        this.xGrid = d3.axisBottom().scale(this.xScale).ticks(this.xMax/12).tickSize(this.height).tickFormat("")
        
        this.ctx.append("g").attr("class", "x axis").attr('transform', 'translate(0,' + (this.height) + ')')
        this.ctx.append("g").attr("class", "y axis")

        this.ctx.append("g").attr("class", "grid x")
        this.ctx.append("g").attr("class", "grid y")

        // 0 line
        this.ctx.append("line").attr("class", 'zero-line')    
        this.lines = []
        this.domainHash = ''
        this.lineIndex = 0
        this.tip = d3Tip().attr('class', 'd3-tip').html((d, i) => `${d.startDate} - ${d.endDate}`)
        this.ctx.call(this.tip)
    }

    reset() {
        this.init();
    }

    draw() {        
        // remove graph node from DOM
        const el = this.base.current.firstChild;
        this.base.current.removeChild(el)

        // recalculate plot configuration
        for(var i = this.lines.length; i < this.props.datasets.length; i++) {
            this.yMax = Math.max(this.yMax, d3.max(this.props.datasets[i]))
        }

        const domainHash = `${this.xMin},${this.xMax},${this.yMin},${this.yMax}`        
        if (this.domainHash !== domainHash) {
            //this.x = this.x 
            this.y = this.y.domain([this.yMin, this.yMax])
            this.line = this.line.y((d, i) => this.y(d))
            this.yAxis = this.yAxis.scale(this.y)
            //this.xAxis = this.xAxis
           
            this.ctx.select('.y.axis').call(this.yAxis);
            this.ctx.select('.x.axis').call(this.xAxis)
            this.ctx.select(".zero-line")
                .attr("x1", 0) .attr("y1", this.y(0)).attr("x2", this.x(this.xMax)).attr("y2",  this.y(0))
                .attr('stroke-width', 2)

            // add the X gridlines
            this.ctx.select('.x.grid').call(this.yGrid)
            this.ctx.select('.y.grid').call(this.xGrid)   
            
            // store configuration hash
            this.domainHash = domainHash;

            // redraw all lines
            this.lineIndex = 0;
        }

        while(this.lineIndex < this.props.datasets.length) {        
            if (this.lines[this.lineIndex]) {
                // line was drawn before, update coords
                this.lines[this.lineIndex].attr('d', this.line(this.props.datasets[this.lineIndex]))
            } else {
                // draw new line
                this.lines[this.lineIndex] = this.ctx.append('path')
                    .datum(this.props.datasets[this.lineIndex])
                    .attr("class", "data-line l"+this.lineIndex)
                    .attr('d', this.line(this.props.datasets[this.lineIndex]))
                    .attr('stroke', () => "hsl(" + (Math.random() * 360) + ",100%,50%)")
                    .on('mouseover', this.tip.show)
                    .on('mouseout', this.tip.hide)
            }
            
            this.lineIndex++;
        }

        // add graph node back to DOM
        window.requestAnimationFrame(() => {
            this.base.current.appendChild(el)
        })
    }

    render() {
        return (
            <div ref={this.base}><svg className="plot"></svg></div>
        )
    }
}

export default Plot;
