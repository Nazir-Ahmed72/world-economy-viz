// Store global data
window.globalData = [];
window.countryKey = 'country_name'; // Default fallback

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    const spinner = document.getElementById('loading-spinner');
    
    // Define numeric columns once
    const numericCols = [
        'year', 'Inflation (CPI %)', 'GDP (Current USD)', 
        'GDP per Capita (Current USD)', 'Unemployment Rate (%)',
        'Interest Rate (Real, %)', 'Inflation (GDP Deflator, %)',
        'GDP Growth (% Annual)', 'Current Account Balance (% GDP)',
        'Government Expense (% of GDP)', 'Government Revenue (% of GDP)',
        'Tax Revenue (% of GDP)', 'Gross National Income (USD)',
        'Public Debt (% of GDP)'
    ];

    // Load CSV data
    d3.csv('data/economy_clean.csv').then(function(data) {
        if (!data || data.length === 0) {
            showError('Data loaded but appears to be empty.');
            return;
        }

        // Parse numeric columns
        data.forEach(d => {
            numericCols.forEach(col => {
                let val = d[col];
                if (val === '' || val === '..' || val === 'nan' || val === undefined) {
                    d[col] = NaN;
                } else {
                    d[col] = parseFloat(val);
                }
            });
        });
        
        // Store global data
        window.globalData = data;
        
        // Extract unique countries and sort A-Z
        // Fallback to 'Country' if 'country_name' is missing
        window.countryKey = data[0].country_name !== undefined ? 'country_name' : 'Country';
        const countries = [...new Set(data.map(d => d[window.countryKey]))].filter(c => c).sort();
        
        // Populate country select dropdown
        const countrySelect = document.getElementById('country-select');
        countrySelect.innerHTML = ''; // Clear existing
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
        
        // Get year range from data
        const years = data.map(d => d.year).filter(y => !isNaN(y));
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        
        // Set year slider range
        const yearSlider = document.getElementById('year-slider');
        yearSlider.min = minYear;
        yearSlider.max = maxYear;
        yearSlider.value = minYear;
        
        document.getElementById('year-min').textContent = minYear;
        document.getElementById('year-max').textContent = maxYear;
        
        // Update year display on slider change
        yearSlider.addEventListener('input', function() {
            document.getElementById('year-max').textContent = this.value;
        });
        
        // Render all charts with full data
        renderAllCharts(window.globalData);
        
        // Hide loading spinner
        spinner.classList.add('hidden');
        
    }).catch(function(error) {
        console.error('Error loading data:', error);
        showError('Failed to load data: ' + error.message);
        spinner.classList.add('hidden');
    });
    
    // Setup filter buttons
    document.getElementById('apply-btn').addEventListener('click', applyFilters);
    document.getElementById('reset-btn').addEventListener('click', resetFilters);
});

// Render all charts
function renderAllCharts(data) {
    try {
        const charts = [
            { id: 'line-chart', fn: 'renderLineChart' },
            { id: 'bar-chart', fn: 'renderBarChart' },
            { id: 'bubble-chart', fn: 'renderBubbleChart' },
            { id: 'heatmap', fn: 'renderHeatmap' },
            { id: 'scatter-plot', fn: 'renderScatterPlot' },
            { id: 'area-chart', fn: 'renderAreaChart' },
            { id: 'pie-chart', fn: 'renderPieChart' },
            { id: 'choropleth-map', fn: 'renderChoroplethMap' }
        ];

        charts.forEach(chart => {
            try {
                const container = document.getElementById(chart.id);
                if (container) container.innerHTML = ''; // Clear previous chart
                if (typeof window[chart.fn] === 'function') {
                    window[chart.fn](data);
                } else {
                    console.warn(`Function ${chart.fn} is not defined. Check if charts/${chart.id.replace('-','')}Chart.js is loaded correctly and defines window.${chart.fn}.`);
                }
            } catch (err) {
                console.error(`Error rendering ${chart.id} (${chart.fn}):`, err);
            }
        });
    } catch (error) {
        console.error('Error rendering charts:', error);
        showError('Error rendering charts: ' + error.message);
    }
}

// Apply filters
function applyFilters() {
    const countrySelect = document.getElementById('country-select');
    const yearSlider = document.getElementById('year-slider');
    
    const selectedCountries = Array.from(countrySelect.selectedOptions).map(opt => opt.value);
    const selectedYear = parseInt(yearSlider.value);
    
    // If no countries selected, use all
    let filteredData = window.globalData;
    
    if (selectedCountries.length > 0) {
        filteredData = window.globalData.filter(d => selectedCountries.includes(d[window.countryKey]));
    }
    
    // Filter by year range (from minYear to selectedYear)
    filteredData = filteredData.filter(d => d.year >= parseInt(yearSlider.min) && d.year <= selectedYear);
    
    renderAllCharts(filteredData);
}

// Reset filters
function resetFilters() {
    const countrySelect = document.getElementById('country-select');
    const yearSlider = document.getElementById('year-slider');
    
    // Clear selections
    Array.from(countrySelect.options).forEach(opt => opt.selected = false);
    
    // Reset year slider
    const minYear = parseInt(yearSlider.min);
    yearSlider.value = minYear;
    document.getElementById('year-max').textContent = minYear;
    
    // Render all charts with full data
    renderAllCharts(window.globalData);
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

// Utility function to show tooltip
function showTooltip(html, event) {
    const tooltip = d3.select('.tooltip');
    tooltip.html(html)
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 28) + 'px')
        .classed('show', true);
}

// Utility function to hide tooltip
function hideTooltip() {
    d3.select('.tooltip').classed('show', false);
}
