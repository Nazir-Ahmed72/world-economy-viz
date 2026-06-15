// Area Chart - Public Debt Over Time
window.renderAreaChart = function(data) {
    const container = document.getElementById('area-chart');
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    const validData = data.filter(d => !isNaN(d['Public Debt (% of GDP)']));
    
    if (validData.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    // Get top 6 countries by average public debt
    const countryAgg = d3.rollup(
        validData,
        v => d3.mean(v, d => d['Public Debt (% of GDP)']),
        d => d.country_name
    );
    
    const topCountries = Array.from(countryAgg, ([country, avg]) => ({country, avg}))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 6)
        .map(d => d.country);
    
    const filteredData = validData.filter(d => topCountries.includes(d.country_name));
    const nested = d3.group(filteredData, d => d.country_name);
    
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
        .domain(d3.extent(filteredData, d => d.year))
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d['Public Debt (% of GDP)']) + 10])
        .range([height, 0]);
    
    const colors = d3.schemeTableau10;
    
    // Prepare data for stacked area
    const stackData = topCountries.map(country => {
        const countryData = Array.from(nested.get(country))
            .sort((a, b) => a.year - b.year);
        return {
            country,
            values: countryData
        };
    });
    
    // Area generator
    const area = d3.area()
        .x(d => xScale(d.year))
        .y0(height)
        .y1(d => yScale(d['Public Debt (% of GDP)']))
        .curve(d3.curveMonotoneX);
    
    // Defs for gradients
    const defs = svg.append('defs');
    
    stackData.forEach((d, i) => {
        const gradient = defs.append('linearGradient')
            .attr('id', `gradient-${i}`)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', colors[i])
            .attr('stop-opacity', 0.8);
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', colors[i])
            .attr('stop-opacity', 0.2);
    });
    
    // Draw areas
    stackData.forEach((d, i) => {
        svg.append('path')
            .datum(d.values.sort((a, b) => a.year - b.year))
            .attr('fill', `url(#gradient-${i})`)
            .attr('stroke', colors[i])
            .attr('stroke-width', 2)
            .attr('d', area)
            .attr('class', `area-${i}`)
            .on('mouseover', function() {
                d3.select(this).attr('opacity', 1);
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 0.7);
            });
    });
    
    // Grid lines
    svg.append('g')
        .attr('class', 'grid-line')
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
        );
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
        .append('text')
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
        .text('Public Debt (% of GDP)');
    
    // Legend
    const legend = svg.append('g')
        .selectAll('g')
        .data(stackData)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(${width - 180}, ${i * 20})`)
        .attr('class', 'legend-item')
        .style('cursor', 'pointer');
    
    legend.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', (d, i) => colors[i]);
    
    legend.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .attr('fill', '#e6edf3')
        .style('font-size', '12px')
        .text(d => d.country.length > 15 ? d.country.substring(0, 12) + '...' : d.country);
    
    legend.on('click', function(event, d) {
        const idx = stackData.indexOf(d);
        const area = svg.select(`.area-${idx}`);
        const isHidden = area.style('opacity') === '0';
        area.transition().style('opacity', isHidden ? 0.7 : 0);
    });
    
    // Title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('fill', '#e6edf3')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Public Debt Over Time - Top 6 Countries');
};
