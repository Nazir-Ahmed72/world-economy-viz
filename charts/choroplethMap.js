// Choropleth Map - World GDP per Capita
window.renderChoroplethMap = function(data) {
    const container = document.getElementById('choropleth-map');
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #8b949e;">No data available</p>';
        return;
    }
    
    // Calculate average GDP per Capita per country
    const countryGDP = d3.rollup(
        data.filter(d => !isNaN(d['GDP per Capita (Current USD)'])),
        v => d3.mean(v, d => d['GDP per Capita (Current USD)']),
        d => d.country_id
    );
    
    // ISO to numeric ID mapping
    const isoToNumeric = {
        'AF': 4, 'AL': 8, 'DZ': 12, 'AD': 20, 'AO': 24, 'AR': 32, 'AM': 51, 'AT': 40,
        'AZ': 31, 'BS': 44, 'BH': 48, 'BD': 50, 'BB': 52, 'BY': 112, 'BE': 56, 'BZ': 84,
        'BJ': 204, 'BT': 64, 'BO': 68, 'BA': 70, 'BW': 72, 'BR': 76, 'BN': 96, 'BG': 100,
        'BF': 854, 'BI': 108, 'KH': 116, 'CM': 120, 'CA': 124, 'CV': 132, 'CF': 140, 'TD': 148,
        'CL': 152, 'CN': 156, 'CO': 170, 'KM': 174, 'CG': 178, 'CR': 188, 'HR': 191, 'CU': 192,
        'CY': 196, 'CZ': 203, 'DK': 208, 'DJ': 262, 'DM': 212, 'DO': 214, 'EC': 218, 'EG': 818,
        'SV': 222, 'GQ': 226, 'ER': 232, 'EE': 233, 'ET': 231, 'FJ': 242, 'FI': 246, 'FR': 250,
        'GA': 266, 'GM': 270, 'GE': 268, 'DE': 276, 'GH': 288, 'GR': 300, 'GD': 308, 'GT': 320,
        'GN': 324, 'GW': 624, 'GY': 328, 'HT': 332, 'HN': 340, 'HU': 348, 'IS': 352, 'IN': 356,
        'ID': 360, 'IR': 364, 'IQ': 368, 'IE': 372, 'IL': 376, 'IT': 380, 'CI': 384, 'JM': 388,
        'JP': 392, 'JO': 400, 'KZ': 398, 'KE': 404, 'KP': 408, 'KR': 410, 'KW': 414, 'KG': 417,
        'LA': 418, 'LV': 428, 'LB': 422, 'LS': 426, 'LR': 430, 'LY': 434, 'LI': 438, 'LT': 440,
        'LU': 442, 'MG': 450, 'MW': 454, 'MY': 458, 'MV': 462, 'ML': 466, 'MT': 470, 'MR': 478,
        'MU': 480, 'MX': 484, 'MD': 498, 'MC': 492, 'MN': 496, 'ME': 499, 'MA': 504, 'MZ': 508,
        'MM': 104, 'NA': 516, 'NP': 524, 'NL': 528, 'NZ': 554, 'NI': 558, 'NE': 562, 'NG': 566,
        'NO': 578, 'OM': 512, 'PK': 586, 'PA': 591, 'PG': 598, 'PY': 600, 'PE': 604, 'PH': 608,
        'PL': 616, 'PT': 620, 'QA': 634, 'RO': 642, 'RU': 643, 'RW': 646, 'KN': 659, 'LC': 662,
        'VC': 670, 'WS': 882, 'SM': 674, 'ST': 678, 'SA': 682, 'SN': 686, 'RS': 688, 'SC': 690,
        'SL': 694, 'SG': 702, 'SK': 703, 'SI': 705, 'SB': 90, 'SO': 706, 'ZA': 710, 'SS': 728,
        'ES': 724, 'LK': 144, 'SD': 729, 'SR': 740, 'SZ': 748, 'SE': 752, 'CH': 756, 'SY': 760,
        'TW': 158, 'TJ': 762, 'TZ': 834, 'TH': 764, 'TL': 626, 'TG': 768, 'TO': 776, 'TT': 780,
        'TN': 788, 'TR': 792, 'TM': 795, 'TV': 798, 'UG': 800, 'UA': 804, 'AE': 784, 'GB': 826,
        'US': 840, 'UY': 858, 'UZ': 860, 'VU': 548, 'VE': 862, 'VN': 704, 'YE': 887, 'ZM': 894, 'ZW': 716
    };
    
    // Construct a mapping from numeric ID to lowercase ISO country code
    const numericToIso = {};
    for (const [iso, num] of Object.entries(isoToNumeric)) {
        numericToIso[num] = iso.toLowerCase();
    }

    // Load world topology
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(function(world) {
        const features = topojson.feature(world, world.objects.countries).features;
        
        // Setup dimensions with robust fallback
        const clientWidth = container.clientWidth;
        const width = (clientWidth > 100 ? clientWidth : 800) - 20;
        const height = 600;
        
        // Projection
        const projection = d3.geoNaturalEarth1()
            .fitSize([width, height], topojson.feature(world, world.objects.countries));
        
        const path = d3.geoPath(projection);
        
        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('style', 'background: #0d1117');
        
        // Color scale
        const gdpValues = Array.from(countryGDP.values());
        const colorScale = d3.scaleLinear()
            .domain([d3.min(gdpValues), d3.max(gdpValues)])
            .range(['#ffffcc', '#d62728']);
        
        // Draw countries
        svg.selectAll('path')
            .data(features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => {
                const numericId = parseInt(d.id);
                const isoCode = numericToIso[numericId];
                const gdp = isoCode ? countryGDP.get(isoCode) : null;
                return gdp ? colorScale(gdp) : '#2d333b';
            })
            .attr('stroke', '#0d1117')
            .attr('stroke-width', 0.5)
            .on('mouseover', function(event, d) {
                const numericId = parseInt(d.id);
                const isoCode = numericToIso[numericId];
                const gdp = isoCode ? countryGDP.get(isoCode) : null;
                d3.select(this).attr('opacity', 1).attr('stroke-width', 2);
                
                // Find country name from properties if available
                let countryName = d.properties ? d.properties.name : 'Unknown';
                
                showTooltip(
                    `<strong>${countryName}</strong><br/>
                    Avg GDP per Capita: $${gdp ? gdp.toFixed(0) : 'N/A'}`,
                    event
                );
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 0.8).attr('stroke-width', 0.5);
                hideTooltip();
            })
            .attr('opacity', 0.8);
        
        // Legend
        const legendWidth = 300;
        const legendHeight = 30;
        const legendX = 20;
        const legendY = height - 60;
        
        const legend = svg.append('g')
            .attr('transform', `translate(${legendX},${legendY})`);
        
        // Gradient definition
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');
        
        gradient.append('stop').attr('offset', '0%').attr('stop-color', '#ffffcc');
        gradient.append('stop').attr('offset', '100%').attr('stop-color', '#d62728');
        
        // Legend background
        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight + 30)
            .attr('fill', '#161b22')
            .attr('opacity', 0.8)
            .attr('rx', 4);
        
        // Legend gradient bar
        legend.append('rect')
            .attr('x', 10)
            .attr('y', 10)
            .attr('width', legendWidth - 20)
            .attr('height', 15)
            .attr('fill', 'url(#gradient)')
            .attr('stroke', '#30363d');
        
        // Legend text
        legend.append('text')
            .attr('x', 10)
            .attr('y', 30)
            .attr('fill', '#e6edf3')
            .style('font-size', '11px')
            .text('Low GDP per Capita');
        
        legend.append('text')
            .attr('x', legendWidth - 130)
            .attr('y', 30)
            .attr('fill', '#e6edf3')
            .style('font-size', '11px')
            .text('High GDP per Capita');
        
        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('fill', '#e6edf3')
            .style('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('GDP per Capita by Country (Average 2000-2022)');
        
        // Zoom
        const zoom = d3.zoom().on('zoom', (event) => {
            svg.selectAll('path').attr('transform', event.transform);
        });
        
        svg.call(zoom);
        
    }).catch(error => {
        console.error('Error loading world map:', error);
        container.innerHTML = '<p style="padding: 50px; text-align: center; color: #e6edf3;">Error loading world map data</p>';
    });
};
