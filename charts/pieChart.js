// Pie/Donut Chart - Government Finance
window.renderPieChart = function(data) {
    const container = document.getElementById('pie-chart');
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    // Calculate averages
    const expenseAvg = d3.mean(data.filter(d => !isNaN(d['Government Expense (% of GDP)'])), d => d['Government Expense (% of GDP)']) || 0;
    const revenueAvg = d3.mean(data.filter(d => !isNaN(d['Government Revenue (% of GDP)'])), d => d['Government Revenue (% of GDP)']) || 0;
    const taxAvg = d3.mean(data.filter(d => !isNaN(d['Tax Revenue (% of GDP)'])), d => d['Tax Revenue (% of GDP)']) || 0;
    
    const chartData = [
        {label: 'Gov. Expense', value: Math.max(0, expenseAvg), color: '#58a6ff'},
        {label: 'Gov. Revenue', value: Math.max(0, revenueAvg), color: '#f78166'},
        {label: 'Tax Revenue', value: Math.max(0, taxAvg), color: '#79c0ff'}
    ];
    
    // Setup dimensions
    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 40;
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);
    
    // Pie layout
    const pie = d3.pie()
        .value(d => d.value);
    
    const arcs = pie(chartData);
    
    // Arc generator
    const arcGenerator = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius);
    
    const arcHover = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius + 10);
    
    // Slices
    svg.selectAll('path')
        .data(arcs)
        .enter()
        .append('path')
        .attr('d', arcGenerator)
        .attr('fill', d => d.data.color)
        .attr('opacity', 0.8)
        .attr('stroke', '#0d1117')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('opacity', 1)
                .attr('d', arcHover);
            
            showTooltip(
                `<strong>${d.data.label}</strong><br/>
                ${d.data.value.toFixed(2)}% of GDP`,
                event
            );
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .attr('opacity', 0.8)
                .attr('d', arcGenerator);
            hideTooltip();
        });
    
    // Center text
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -10)
        .attr('fill', '#e6edf3')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Gov.');
    
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 15)
        .attr('fill', '#e6edf3')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Finance');
    
    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${-width / 2 + 30}, ${height / 2 - 100})`);
    
    legend.selectAll('g')
        .data(chartData)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(0, ${i * 25})`)
        .each(function(d) {
            const g = d3.select(this);
            g.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', d.color);
            
            g.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .attr('fill', '#e6edf3')
                .style('font-size', '12px')
                .text(`${d.label}: ${d.value.toFixed(2)}%`);
        });
    
    // Title
    svg.append('text')
        .attr('y', -height / 2 + 30)
        .attr('fill', '#e6edf3')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Government Finance Breakdown');
};
