// Heatmap - Economic Indicators Correlation
window.renderHeatmap = function(data) {
    const container = document.getElementById('heatmap');
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    const indicators = [
        'Inflation (CPI %)',
        'GDP Growth (% Annual)',
        'Unemployment Rate (%)',
        'Interest Rate (Real, %)',
        'Public Debt (% of GDP)',
        'Current Account Balance (% GDP)',
        'Government Expense (% of GDP)',
        'Government Revenue (% of GDP)'
    ];
    
    // Filter valid data
    const validData = data.filter(d => {
        return indicators.every(ind => !isNaN(d[ind]));
    });
    
    if (validData.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    // Calculate Pearson correlation
    function pearsonCorrelation(arr1, arr2) {
        const n = arr1.length;
        const mean1 = arr1.reduce((a, b) => a + b) / n;
        const mean2 = arr2.reduce((a, b) => a + b) / n;
        
        let numerator = 0;
        let denominator1 = 0;
        let denominator2 = 0;
        
        for (let i = 0; i < n; i++) {
            const diff1 = arr1[i] - mean1;
            const diff2 = arr2[i] - mean2;
            numerator += diff1 * diff2;
            denominator1 += diff1 * diff1;
            denominator2 += diff2 * diff2;
        }
        
        return numerator / Math.sqrt(denominator1 * denominator2);
    }
    
    // Build correlation matrix
    const correlations = [];
    for (let i = 0; i < indicators.length; i++) {
        for (let j = i; j < indicators.length; j++) {
            const data1 = validData.map(d => d[indicators[i]]);
            const data2 = validData.map(d => d[indicators[j]]);
            const corr = pearsonCorrelation(data1, data2);
            correlations.push({
                i: i,
                j: j,
                value: isNaN(corr) ? 0 : corr,
                ind1: indicators[i],
                ind2: indicators[j]
            });
        }
    }
    
    // Setup dimensions
    const cellSize = 40;
    const width = indicators.length * cellSize + 100;
    const height = indicators.length * cellSize + 100;
    const margin = {top: 120, right: 40, bottom: 40, left: 180};
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left)
        .attr('height', height + margin.top)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Color scale
    const colorScale = d3.scaleLinear()
        .domain([-1, 0, 1])
        .range(['#d62728', '#ffffff', '#2ca02c']);
    
    // Draw cells
    svg.selectAll('rect')
        .data(correlations)
        .enter()
        .append('rect')
        .attr('x', d => d.j * cellSize)
        .attr('y', d => d.i * cellSize)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', '#30363d')
        .on('mouseover', function(event, d) {
            showTooltip(
                `<strong>${d.ind1}</strong><br/>
                <strong>${d.ind2}</strong><br/>
                Correlation: ${d.value.toFixed(3)}`,
                event
            );
        })
        .on('mouseout', hideTooltip);
    
    // Add text values
    svg.selectAll('text.corr-value')
        .data(correlations)
        .enter()
        .append('text')
        .attr('class', 'corr-value')
        .attr('x', d => d.j * cellSize + cellSize / 2)
        .attr('y', d => d.i * cellSize + cellSize / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', d => Math.abs(d.value) > 0.5 ? '#0d1117' : '#e6edf3')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text(d => d.value.toFixed(2));
    
    // X axis labels (rotated)
    svg.append('g')
        .selectAll('text')
        .data(indicators)
        .enter()
        .append('text')
        .attr('x', (d, i) => i * cellSize + cellSize / 2)
        .attr('y', -10)
        .attr('text-anchor', 'end')
        .attr('fill', '#e6edf3')
        .style('font-size', '11px')
        .attr('transform', (d, i) => `rotate(-45 ${i * cellSize + cellSize / 2} -10)`)
        .text(d => d.substring(0, 20));
    
    // Y axis labels
    svg.append('g')
        .selectAll('text')
        .data(indicators)
        .enter()
        .append('text')
        .attr('x', -10)
        .attr('y', (d, i) => i * cellSize + cellSize / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .attr('fill', '#e6edf3')
        .style('font-size', '11px')
        .text(d => d.substring(0, 20));
    
    // Title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -60)
        .attr('fill', '#e6edf3')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Correlation Matrix of Economic Indicators');
};
