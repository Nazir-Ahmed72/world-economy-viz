// Scatter Plot - Phillips Curve (Unemployment vs Inflation)
window.renderScatterPlot = function(data) {
    const container = document.getElementById('scatter-plot');
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    const validData = data.filter(d => 
        !isNaN(d['Unemployment Rate (%)']) && 
        !isNaN(d['Inflation (CPI %)'])
    );
    
    if (validData.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    // Setup dimensions with robust fallback
    const clientWidth = container.clientWidth;
    const width = (clientWidth > 120 ? clientWidth : 800) - 120;
    const height = 500;
    const margin = {top: 50, right: 40, bottom: 70, left: 80};
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([
            d3.min(validData, d => d['Unemployment Rate (%)']) - 1,
            d3.max(validData, d => d['Unemployment Rate (%)']) + 1
        ])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([
            d3.min(validData, d => d['Inflation (CPI %)']) - 2,
            d3.max(validData, d => d['Inflation (CPI %)']) + 2
        ])
        .range([height, 0]);
    
    const yearScale = d3.scaleLinear()
        .domain(d3.extent(validData, d => d.year))
        .range([0, 1]);
    
    // Grid lines
    svg.append('g')
        .attr('class', 'grid-line')
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
        );
    
    // Linear regression
    function linearRegression(data) {
        const n = data.length;
        const sumX = data.reduce((a, d) => a + d['Unemployment Rate (%)'], 0);
        const sumY = data.reduce((a, d) => a + d['Inflation (CPI %)'], 0);
        const sumXY = data.reduce((a, d) => a + d['Unemployment Rate (%)'] * d['Inflation (CPI %)'], 0);
        const sumX2 = data.reduce((a, d) => a + d['Unemployment Rate (%)'] ** 2, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
        const intercept = (sumY - slope * sumX) / n;
        
        return {slope, intercept};
    }
    
    const regression = linearRegression(validData);
    const x0 = xScale.domain()[0];
    const x1 = xScale.domain()[1];
    const y0 = regression.slope * x0 + regression.intercept;
    const y1 = regression.slope * x1 + regression.intercept;
    
    // Draw regression line
    svg.append('line')
        .attr('class', 'regression-line')
        .attr('x1', xScale(x0))
        .attr('y1', yScale(y0))
        .attr('x2', xScale(x1))
        .attr('y2', yScale(y1))
        .attr('stroke', '#f78166')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.7);
    
    // Label on regression line
    const labelXDataVal = 0.7 * (x1 - x0) + x0;
    svg.append('text')
        .attr('class', 'regression-label')
        .attr('x', xScale(labelXDataVal))
        .attr('y', yScale(regression.slope * labelXDataVal + regression.intercept))
        .attr('fill', '#f78166')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Phillips Curve');
    
    // Dots
    svg.selectAll('circle')
        .data(validData)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d['Unemployment Rate (%)']))
        .attr('cy', d => yScale(d['Inflation (CPI %)']))
        .attr('r', 4)
        .attr('fill', d => d3.interpolateViridis(yearScale(d.year)))
        .attr('opacity', 0.6)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1).attr('r', 6);
            showTooltip(
                `<strong>${d.country_name}</strong><br/>
                Year: ${d.year}<br/>
                Unemployment: ${d['Unemployment Rate (%)'].toFixed(2)}%<br/>
                Inflation: ${d['Inflation (CPI %)'].toFixed(2)}%`,
                event
            );
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.6).attr('r', 4);
            hideTooltip();
        });
    
    // X axis
    const xAxisGroup = svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale));
        
    xAxisGroup.append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', '#e6edf3')
        .style('text-anchor', 'middle')
        .text('Unemployment Rate (%)');
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .attr('fill', '#e6edf3')
        .style('text-anchor', 'middle')
        .text('Inflation (CPI %)');
    
    // Title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('fill', '#e6edf3')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Phillips Curve: Unemployment vs Inflation');
    
    // Legend for year color
    const legendData = [
        {year: d3.min(validData, d => d.year), label: 'Early'},
        {year: d3.max(validData, d => d.year), label: 'Recent'}
    ];
    
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, 10)`);
    
    legendData.forEach((d, i) => {
        legend.append('rect')
            .attr('x', 0)
            .attr('y', i * 25)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', d3.interpolateViridis(yearScale(d.year)));
        
        legend.append('text')
            .attr('x', 20)
            .attr('y', i * 25 + 12)
            .attr('fill', '#e6edf3')
            .style('font-size', '11px')
            .text(d.label + ` (${d.year})`);
    });
    
    // Zoom
    const zoom = d3.zoom().on('zoom', (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        xAxisGroup.call(d3.axisBottom(newXScale));
        svg.selectAll('circle').attr('cx', d => newXScale(d['Unemployment Rate (%)']));
        
        // Update regression line coordinates
        svg.select('.regression-line')
            .attr('x1', newXScale(x0))
            .attr('x2', newXScale(x1));
            
        // Update regression label position
        svg.select('.regression-label')
            .attr('x', newXScale(labelXDataVal))
            .attr('y', yScale(regression.slope * labelXDataVal + regression.intercept));
    });
    
    d3.select(container).select('svg').call(zoom);
};
