// Line Chart - GDP Growth Over Time
window.renderLineChart = function(data) {
    const container = document.getElementById('line-chart');
    container.innerHTML = '';
    
    // Check for data
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    // Filter data with valid GDP Growth values
    const validData = data.filter(d => d.year && !isNaN(d['GDP Growth (% Annual)']));
    
    if (validData.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    // Group by country
    const nested = d3.group(validData, d => d.country_name);
    const countries = Array.from(nested.keys()).slice(0, 10);
    
    // Setup dimensions with robust fallback
    const clientWidth = container.clientWidth;
    const width = (clientWidth > 120 ? clientWidth : 800) - 120;
    const height = 500;
    const margin = {top: 50, right: 40, bottom: 70, left: 80};
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(validData, d => d.year))
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([
            d3.min(validData, d => d['GDP Growth (% Annual)']) - 5,
            d3.max(validData, d => d['GDP Growth (% Annual)']) + 5
        ])
        .range([height, 0]);
    
    const colors = d3.schemeTableau10;
    
    // Line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d['GDP Growth (% Annual)']))
        .curve(d3.curveCatmullRom);
    
    // Grid lines
    svg.append('g')
        .attr('class', 'grid-line')
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
        );
    
    // Draw lines
    countries.forEach((country, i) => {
        const countryData = nested.get(country).sort((a, b) => a.year - b.year);
        
        svg.append('path')
            .datum(countryData)
            .attr('fill', 'none')
            .attr('stroke', colors[i])
            .attr('stroke-width', 2)
            .attr('d', line)
            .attr('class', `line line-${i}`)
            .style('opacity', 0.8);
        
        // Animate line drawing
        const totalLength = svg.select(`.line-${i}`).node().getTotalLength();
        svg.select(`.line-${i}`)
            .attr('stroke-dasharray', totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(1500)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0);
    });
    
    // X axis
    const xAxisGroup = svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));
        
    xAxisGroup.append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', '#e6edf3')
        .style('text-anchor', 'middle')
        .text('Year');
    
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
        .text('GDP Growth (% Annual)');
    
    // Legend
    const legend = svg.append('g')
        .attr('font-size', 10)
        .attr('text-anchor', 'end')
        .selectAll('g')
        .data(countries)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(0,${i * 20})`)
        .attr('class', 'legend-item')
        .style('cursor', 'pointer');
    
    legend.append('rect')
        .attr('x', width - 19)
        .attr('width', 19)
        .attr('height', 19)
        .attr('fill', (d, i) => colors[i]);
    
    legend.append('text')
        .attr('x', width - 24)
        .attr('y', 9.5)
        .attr('dy', '0.32em')
        .attr('fill', '#e6edf3')
        .text(d => d.length > 15 ? d.substring(0, 12) + '...' : d);
    
    // Legend interactivity
    legend.on('click', function(event, country) {
        const idx = countries.indexOf(country);
        const line = svg.select(`.line-${idx}`);
        const isHidden = line.style('opacity') === '0';
        line.transition().style('opacity', isHidden ? 0.8 : 0);
    });
    
    // Title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('fill', '#e6edf3')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('GDP Growth Over Time');
    
    // Zoom
    const zoom = d3.zoom()
        .on('zoom', (event) => {
            const newXScale = event.transform.rescaleX(xScale);
            xAxisGroup.call(d3.axisBottom(newXScale).tickFormat(d3.format('d')));
            svg.selectAll('path.line').attr('d', d => {
                return d3.line()
                    .x(dp => newXScale(dp.year))
                    .y(dp => yScale(dp['GDP Growth (% Annual)']))
                    .curve(d3.curveCatmullRom)(d);
            });
        });
    
    d3.select(container).select('svg').call(zoom);
};
