import React, { Component } from 'react';
import * as d3 from 'd3';
import 'd3-dsv';
import 'd3-transition';

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
        const margin = {top: 10, right: 10, bottom: 20, left: 70};
        this.ctx = d3.select(this.base.current)
        this.ctx.selectAll('*').remove();
        this.width = Math.min(window.innerWidth - 40, 860) - margin.left - margin.right;
        this.height = Math.min(350, this.width / 1.5) - margin.top - margin.bottom;

        this.ctx = this.ctx
            .attr("width", this.width + margin.left + margin.right)
            .attr("height", this.height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        this.x = d3.scaleLinear().range([0, this.width])
        this.y = d3.scaleLinear().range([this.height, 0]) 

        this.ctx.append("svg:g")
            .attr("class", "x axis")
            .attr('transform', 'translate(0,' + (this.height) + ')')

        this.ctx.append("svg:g")
            .attr("class", "y axis")

        // 0 line
        this.ctx.append("line")      
            .attr("class", 'zero-line')    
            .style("stroke", "red") 
            .style('stroke-width', 2)

        this.drawn = [];
        this.domainHash = '';
        this.yMin = 0;
        this.yMax = 0;
    }

    reset() {
        this.init();
    }

    draw(datasets) {
        if (!datasets || datasets.length < 1) {
            return;
        }

        const last = datasets[this.drawn.length];
        const yMin = this.yMin = Math.min(this.yMin, d3.min(last))
        const yMax = this.yMax = Math.max(this.yMax, d3.max(last))
        const xMin = 0;
        const xMax = this.props.xMax;
        const domainHash = `${xMin},${xMax},${yMin},${yMax}`
        const diff = this.domainHash !== domainHash;
        const graph = this.ctx;
        
        if (diff) {
            this.x = this.x.domain([xMin, xMax])
            this.y = this.y.domain([yMin, yMax])

            this.line = d3.line()
                .x((d, i) => this.x(i))
                .y((d, i) => this.y(d))

            let yAxis = d3.axisLeft().scale(this.y)
            graph.select('.y.axis').call(yAxis);

            let xScale = d3.scaleLinear().range([0, this.width]).domain([xMin, xMax/12]);
            let xAxis = d3.axisBottom().scale(xScale).ticks(xMax/12);

            if (this.width < 600) {
                xAxis.ticks(3);
            }
            graph.select('.x.axis').call(xAxis)

            graph.select(".zero-line")
                .attr("x1", 0)
                .attr("y1", this.y(0))      
                .attr("x2", this.x(360))     
                .attr("y2",  this.y(0))

          
        }
        
        // draw (or update) graph lines when browser sees fit
        let i = 0;
        let drawLine = () => {
            if(this.drawn[i]) {
                // only update this line if something important in the graph dimensions changed
                if(diff) {
                    graph
                        .select(".line-"+i)
                        .attr('d', this.line(datasets[i]))
                }
            } else {
                // draw new line
                let path = graph.append('svg:path')
                    .attr("class", "line-"+i)
                    .attr('d', this.line(datasets[i]))
                    .attr('stroke', () => "hsl(" + (Math.random() * 360) + ",100%,50%)")
                    .attr('stroke-width', 1)
                    .attr('fill', 'none')

                // animate line
                let totalLength = path.node().getTotalLength()  
                path.attr("stroke-dasharray", totalLength + " " + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(80)
                    .attr("stroke-dashoffset", 0);

                this.drawn[i] = true;
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
