/**
 * KPI Summary Cards & Sortable Data Table
 */

// Helper to format GDP and other large numbers
function formatGDP(value) {
    if (isNaN(value) || value === null || value === undefined) return '—';
    const absVal = Math.abs(value);
    let formatted = '';
    if (absVal >= 1e12) {
        formatted = (value / 1e12).toFixed(2) + 'T';
    } else if (absVal >= 1e9) {
        formatted = (value / 1e9).toFixed(2) + 'B';
    } else if (absVal >= 1e6) {
        formatted = (value / 1e6).toFixed(2) + 'M';
    } else {
        formatted = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return '$' + formatted;
}

// Render KPI Cards
window.renderKPICards = function(data) {
    const container = document.getElementById('kpi-container');
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<div style="grid-column: span 4; padding: 30px; text-align: center; color: var(--text-secondary);">No KPI data available</div>';
        return;
    }

    // Identify latest year and previous year in filtered data
    const years = data.map(d => d.year).filter(y => !isNaN(y));
    const latestYear = years.length > 0 ? Math.max(...years) : null;
    const prevYear = latestYear !== null ? latestYear - 1 : null;

    // Define the 4 cards configs
    const cardsConfig = [
        {
            id: 'gdp',
            title: 'Average GDP',
            metricLabel: 'Average GDP (Current USD)',
            field: 'GDP (Current USD)',
            icon: '💰',
            isGoodWhenIncreased: true,
            formatter: formatGDP
        },
        {
            id: 'inflation',
            title: 'Average Inflation',
            metricLabel: 'Average Inflation (CPI %)',
            field: 'Inflation (CPI %)',
            icon: '📈',
            isGoodWhenIncreased: false,
            formatter: v => v.toFixed(2) + '%'
        },
        {
            id: 'unemployment',
            title: 'Average Unemployment',
            metricLabel: 'Average Unemployment Rate (%)',
            field: 'Unemployment Rate (%)',
            icon: '👥',
            isGoodWhenIncreased: false,
            formatter: v => v.toFixed(2) + '%'
        },
        {
            id: 'debt',
            title: 'Average Public Debt',
            metricLabel: 'Average Public Debt (% of GDP)',
            field: 'Public Debt (% of GDP)',
            icon: '🏦',
            isGoodWhenIncreased: false,
            formatter: v => v.toFixed(2) + '%'
        }
    ];

    cardsConfig.forEach(m => {
        // Compute overall average for the main value in filtered dataset
        const validValues = data.map(d => d[m.field]).filter(v => !isNaN(v) && v !== null);
        const overallAvg = validValues.length > 0 ? d3.mean(validValues) : NaN;

        // Compute latest year average vs previous year average for trend indicators
        const latestRows = data.filter(d => d.year === latestYear && !isNaN(d[m.field]) && d[m.field] !== null);
        const prevRows = data.filter(d => d.year === prevYear && !isNaN(d[m.field]) && d[m.field] !== null);
        const latestAvg = latestRows.length > 0 ? d3.mean(latestRows, d => d[m.field]) : NaN;
        const prevAvg = prevRows.length > 0 ? d3.mean(prevRows, d => d[m.field]) : NaN;

        // Trend calculation
        let trendHTML = '<span style="color: var(--text-secondary)">— No historical data</span>';
        if (!isNaN(latestAvg) && !isNaN(prevAvg) && prevAvg !== 0) {
            const diff = latestAvg - prevAvg;
            const pctChange = (diff / prevAvg) * 100;
            const absPct = Math.abs(pctChange).toFixed(2) + '%';
            
            if (diff > 0.0001) {
                const className = m.isGoodWhenIncreased ? 'trend-up-good' : 'trend-up-bad';
                trendHTML = `<span class="${className}">▲ ${absPct}</span> <span style="color: var(--text-secondary); font-size: 11px;">vs prev. year</span>`;
            } else if (diff < -0.0001) {
                const className = m.isGoodWhenIncreased ? 'trend-down-bad' : 'trend-down-good';
                trendHTML = `<span class="${className}">▼ ${absPct}</span> <span style="color: var(--text-secondary); font-size: 11px;">vs prev. year</span>`;
            } else {
                trendHTML = `<span style="color: var(--text-secondary); font-size: 11px;">0.00% vs prev. year</span>`;
            }
        }

        // Render card shell
        const card = document.createElement('div');
        card.className = 'kpi-card';
        card.innerHTML = `
            <span class="kpi-icon">${m.icon}</span>
            <div class="kpi-label">${m.metricLabel}</div>
            <div class="kpi-value" id="kpi-value-${m.id}">—</div>
            <div class="kpi-trend">${trendHTML}</div>
        `;
        container.appendChild(card);

        // Animate counter if we have a valid overall value
        const valElem = document.getElementById(`kpi-value-${m.id}`);
        if (valElem && !isNaN(overallAvg)) {
            if (typeof window.animateCounter === 'function') {
                window.animateCounter(valElem, 0, overallAvg, 1500, m.formatter);
            } else {
                valElem.textContent = m.formatter(overallAvg);
            }
        } else if (valElem) {
            valElem.textContent = '—';
        }
    });
};

// Stateful Table Implementation
const tableState = {
    originalData: [],
    aggregatedData: [],
    searchTerm: '',
    sortColumn: null,      // column name
    sortDirection: null,   // 'asc', 'desc', null
    currentPage: 1,
    pageSize: 20
};

// Helper formatters for table cells
function formatTableCurrency(val) {
    if (isNaN(val) || val === null || val === undefined) return '—';
    return '$' + Math.round(val).toLocaleString();
}

function formatTablePercent(val) {
    if (isNaN(val) || val === null || val === undefined) return '—';
    return val.toFixed(2) + '%';
}

function getGDPGrowthClass(val) {
    if (isNaN(val) || val === null || val === undefined) return 'cell-null';
    return val > 0 ? 'cell-green' : (val < 0 ? 'cell-red' : '');
}

function getUnemploymentClass(val) {
    if (isNaN(val) || val === null || val === undefined) return 'cell-null';
    if (val > 10) return 'cell-red';
    if (val >= 5) return 'cell-orange';
    return 'cell-green';
}

function getInflationClass(val) {
    if (isNaN(val) || val === null || val === undefined) return 'cell-null';
    if (val > 10) return 'cell-red';
    if (val >= 2) return 'cell-orange';
    return 'cell-green';
}

function getPublicDebtClass(val) {
    if (isNaN(val) || val === null || val === undefined) return 'cell-null';
    if (val > 100) return 'cell-red';
    if (val >= 60) return 'cell-orange';
    return 'cell-green';
}

// Main rendering of data table
window.renderDataTable = function(data) {
    tableState.originalData = data;

    // Reset page and search terms when the main filters reset/change
    // (If data is globalData, it means a full reset occurred)
    if (window.globalData && data === window.globalData) {
        tableState.searchTerm = '';
        const searchInput = document.getElementById('table-search-input');
        if (searchInput) searchInput.value = '';
    }

    // Aggregate by country
    const countryKey = window.countryKey || 'country_name';
    const grouped = d3.groups(data, d => d[countryKey]);
    tableState.aggregatedData = grouped.map(([country, rows]) => {
        return {
            country: country,
            gdp: d3.mean(rows, d => d['GDP (Current USD)']),
            gdpCapita: d3.mean(rows, d => d['GDP per Capita (Current USD)']),
            inflation: d3.mean(rows, d => d['Inflation (CPI %)']),
            unemployment: d3.mean(rows, d => d['Unemployment Rate (%)']),
            publicDebt: d3.mean(rows, d => d['Public Debt (% of GDP)']),
            gdpGrowth: d3.mean(rows, d => d['GDP Growth (% Annual)']),
            gni: d3.mean(rows, d => d['Gross National Income (USD)'])
        };
    });

    const container = document.getElementById('data-table-container');
    if (!container) return;

    // Build structure if it doesn't exist yet (retains input focus on typing)
    if (!container.querySelector('.table-controls')) {
        container.innerHTML = `
            <div class="table-controls">
                <input type="text" class="table-search" id="table-search-input" placeholder="Search by country name...">
                <div class="table-info" id="table-row-info">Showing 0 of 0 countries</div>
            </div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="cursor: default; width: 60px;">#</th>
                            <th data-col="country">Country</th>
                            <th data-col="gdp">Avg GDP (USD)</th>
                            <th data-col="gdpCapita">GDP per Capita</th>
                            <th data-col="inflation">Inflation %</th>
                            <th data-col="unemployment">Unemployment %</th>
                            <th data-col="publicDebt">Public Debt %</th>
                            <th data-col="gdpGrowth">GDP Growth %</th>
                            <th data-col="gni">GNI (USD)</th>
                        </tr>
                    </thead>
                    <tbody id="table-body"></tbody>
                </table>
            </div>
            <div class="pagination" id="table-pagination"></div>
        `;

        // Add search input handler
        const searchInput = document.getElementById('table-search-input');
        searchInput.addEventListener('input', function() {
            tableState.searchTerm = this.value;
            tableState.currentPage = 1;
            renderTableRows();
        });

        // Add column sort headers handlers
        const headers = container.querySelectorAll('th[data-col]');
        headers.forEach(th => {
            th.addEventListener('click', () => {
                const col = th.getAttribute('data-col');
                if (tableState.sortColumn === col) {
                    if (tableState.sortDirection === 'asc') {
                        tableState.sortDirection = 'desc';
                    } else if (tableState.sortDirection === 'desc') {
                        tableState.sortDirection = null;
                        tableState.sortColumn = null;
                    }
                } else {
                    tableState.sortColumn = col;
                    tableState.sortDirection = 'asc';
                }
                renderTableRows();
            });
        });
    }

    // Initial render of rows
    renderTableRows();
};

// Render rows based on state
function renderTableRows() {
    const container = document.getElementById('data-table-container');
    if (!container) return;

    // Filter aggregated countries by search term
    let processed = tableState.aggregatedData.filter(d => {
        return d.country.toLowerCase().includes(tableState.searchTerm.toLowerCase());
    });

    // Handle sorting
    if (tableState.sortColumn && tableState.sortDirection) {
        const col = tableState.sortColumn;
        const dir = tableState.sortDirection === 'asc' ? 1 : -1;

        processed.sort((a, b) => {
            const valA = a[col];
            const valB = b[col];

            // Safely verify if values are NaNs, nulls, or undefined
            const aNaN = valA === null || isNaN(valA) || valA === undefined;
            const bNaN = valB === null || isNaN(valB) || valB === undefined;

            // naNs always go to the bottom of the list
            if (aNaN && bNaN) return 0;
            if (aNaN) return 1;
            if (bNaN) return -1;

            if (typeof valA === 'string') {
                return dir * valA.localeCompare(valB);
            } else {
                return dir * (valA - valB);
            }
        });
    }

    // Update column headers classes and arrow symbols
    const headers = container.querySelectorAll('th[data-col]');
    headers.forEach(th => {
        th.classList.remove('sort-active');
        let text = th.textContent.replace(/ [▲▼]/g, '');
        th.textContent = text;

        const col = th.getAttribute('data-col');
        if (col === tableState.sortColumn && tableState.sortDirection) {
            th.classList.add('sort-active');
            th.textContent = text + (tableState.sortDirection === 'asc' ? ' ▲' : ' ▼');
        }
    });

    // Pagination bounds
    const totalRows = processed.length;
    const totalPages = Math.ceil(totalRows / tableState.pageSize) || 1;

    if (tableState.currentPage > totalPages) {
        tableState.currentPage = totalPages;
    }
    if (tableState.currentPage < 1) {
        tableState.currentPage = 1;
    }

    const startIndex = (tableState.currentPage - 1) * tableState.pageSize;
    const endIndex = Math.min(startIndex + tableState.pageSize, totalRows);
    const pageData = processed.slice(startIndex, endIndex);

    // Render body
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 40px; font-size: 14px;">No matching countries found</td></tr>`;
    } else {
        pageData.forEach((d, index) => {
            const rowIdx = startIndex + index + 1;
            const tr = document.createElement('tr');

            const gdpGrowthClass = getGDPGrowthClass(d.gdpGrowth);
            const unemploymentClass = getUnemploymentClass(d.unemployment);
            const inflationClass = getInflationClass(d.inflation);
            const publicDebtClass = getPublicDebtClass(d.publicDebt);

            tr.innerHTML = `
                <td style="color: var(--text-secondary); font-weight: 500;">${rowIdx}</td>
                <td style="font-weight: 600; color: var(--accent);">${d.country}</td>
                <td>${formatTableCurrency(d.gdp)}</td>
                <td>${formatTableCurrency(d.gdpCapita)}</td>
                <td class="${inflationClass}">${formatTablePercent(d.inflation)}</td>
                <td class="${unemploymentClass}">${formatTablePercent(d.unemployment)}</td>
                <td class="${publicDebtClass}">${formatTablePercent(d.publicDebt)}</td>
                <td class="${gdpGrowthClass}">${formatTablePercent(d.gdpGrowth)}</td>
                <td>${formatTableCurrency(d.gni)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Update Row Info text
    const rowInfo = document.getElementById('table-row-info');
    if (rowInfo) {
        if (totalRows === 0) {
            rowInfo.textContent = 'Showing 0 of 0 countries';
        } else {
            rowInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalRows} countries`;
        }
    }

    // Render Pagination Controls
    const paginationContainer = document.getElementById('table-pagination');
    if (paginationContainer) {
        paginationContainer.innerHTML = `
            <button class="page-btn" id="prev-page-btn" ${tableState.currentPage === 1 ? 'disabled' : ''}>Previous</button>
            <span class="page-info">Page ${tableState.currentPage} of ${totalPages}</span>
            <button class="page-btn" id="next-page-btn" ${tableState.currentPage === totalPages ? 'disabled' : ''}>Next</button>
        `;

        document.getElementById('prev-page-btn').addEventListener('click', () => {
            if (tableState.currentPage > 1) {
                tableState.currentPage--;
                renderTableRows();
            }
        });

        document.getElementById('next-page-btn').addEventListener('click', () => {
            if (tableState.currentPage < totalPages) {
                tableState.currentPage++;
                renderTableRows();
            }
        });
    }
}
