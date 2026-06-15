// Bubble Chart - GDP vs Inflation
window.renderBubbleChart = function(data) {
    const container = document.getElementById('bubble-chart');
    container.innerHTML = '';
    
    // Check for data
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    // Filter valid data
    const validData = data.filter(d => 
        !isNaN(d['GDP per Capita (Current USD)']) && 
        !isNaN(d['Inflation (CPI %)']) && 
        !isNaN(d['GDP (Current USD)'])
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
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(validData, d => d['GDP per Capita (Current USD)']))
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([
            d3.min(validData, d => d['Inflation (CPI %)']) - 2,
            d3.max(validData, d => d['Inflation (CPI %)']) + 2
        ])
        .range([height, 0]);
    
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(validData, d => d['GDP (Current USD)'])])
        .range([3, 30]);
    
    const colors = d3.schemeTableau10;
    const uniqueCountries = [...new Set(validData.map(d => d.country_name))];
    const colorScale = d3.scaleOrdinal()
        .domain(uniqueCountries)
        .range(colors);
    
    // Clip path
    svg.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height);
    
    // Grid lines
    svg.append('g')
        .attr('class', 'grid-line')
        .attr('clip-path', 'url(#clip)')
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
        );
    
    // Bubbles
    svg.append('g')
        .attr('clip-path', 'url(#clip)')
        .selectAll('circle')
        .data(validData)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d['GDP per Capita (Current USD)']))
        .attr('cy', d => yScale(d['Inflation (CPI %)']))
        .attr('r', d => radiusScale(d['GDP (Current USD)']))
        .attr('fill', d => colorScale(d.country_name))
        .attr('opacity', 0.6)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(
                `<strong>${d.country_name}</strong><br/>
                Year: ${d.year}<br/>
                GDP/Capita: $${(d['GDP per Capita (Current USD)']).toFixed(0)}<br/>
                Inflation: ${d['Inflation (CPI %)'].toFixed(2)}%<br/>
                GDP: $${(d['GDP (Current USD)']).toFixed(0)}`,
                event
            );
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.6);
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
        .text('GDP per Capita (Current USD)');
    
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
        .text('GDP per Capita vs Inflation (Bubble size = Total GDP)');
    
    // Zoom
    const zoom = d3.zoom().on('zoom', (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        xAxisGroup.call(d3.axisBottom(newXScale));
        svg.selectAll('circle').attr('cx', d => newXScale(d['GDP per Capita (Current USD)']));
    });
    
    d3.select(container).select('svg').call(zoom);
};
