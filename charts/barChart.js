// Bar Chart - Unemployment Rate by Country
window.renderBarChart = function(data) {
    const container = document.getElementById('bar-chart');
    container.innerHTML = '';
    
    // Check for data
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    // Aggregate average unemployment per country
    const validData = data.filter(d => !isNaN(d['Unemployment Rate (%)']));
    
    if (validData.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    const countryAgg = d3.rollup(
        validData,
        v => d3.mean(v, d => d['Unemployment Rate (%)']),
        d => d.country_name
    );
    
    const chartData = Array.from(countryAgg, ([country, avg]) => ({country, avg}))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 20);
    
    // Setup dimensions with robust fallback
    const clientWidth = container.clientWidth;
    const width = (clientWidth > 120 ? clientWidth : 800) - 120;
    const height = 500;
    const margin = {top: 50, right: 40, bottom: 70, left: 150};
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.avg)])
        .range([0, width]);
    
    const yScale = d3.scaleBand()
        .domain(chartData.map(d => d.country))
        .range([height, 0])
        .padding(0.2);
    
    const colorScale = d3.scaleLinear()
        .domain([d3.min(chartData, d => d.avg), d3.max(chartData, d => d.avg)])
        .range(['#28a745', '#da3633']);
    
    // Bars
    svg.selectAll('.bar')
        .data(chartData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('y', d => yScale(d.country))
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.avg))
        .attr('width', 0)
        .on('mouseover', function(event, d) {
            showTooltip(`<strong>${d.country}</strong><br/>Avg Unemployment: ${d.avg.toFixed(2)}%`, event);
        })
        .on('mouseout', hideTooltip)
        .transition()
        .duration(800)
        .attr('width', d => xScale(d.avg));
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(yScale))
        .style('font-size', '11px');
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', '#e6edf3')
        .style('text-anchor', 'middle')
        .text('Average Unemployment Rate (%)');
    
    // Title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('fill', '#e6edf3')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Top 20 Countries by Unemployment Rate');
};
