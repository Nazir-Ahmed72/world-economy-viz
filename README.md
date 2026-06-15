# Global Economy Dashboard

## Course
DSC327 - Data Visualization Techniques

## Team Members
- [Student 1 Name]
- [Student 2 Name]

## Dataset
File: data/world_bank_data_2025.csv
Source: World Bank Open Data
Indicators: GDP, Inflation, Unemployment, Public Debt, Government Finance, Interest Rate, GNI

## How to Run

### 1. Activate Virtual Environment (Windows)
```
venv\Scripts\activate
```

### 2. Install Dependencies
```
pip install -r requirements.txt
```

### 3. Clean the Dataset
```
python preprocessing/clean_data.py
```

### 4. Run the Dashboard
Open `index.html` with Live Server in VS Code, or run a local server:
```
python -m http.server 8000
```
Then open: http://localhost:8000

## Visualizations

1. **Line Chart** — GDP Growth Over Time
   - Shows annual GDP growth rate (%) by country
   - Interactive legend to toggle countries on/off
   - Zoom and pan enabled on X-axis
   - Smooth animated line drawing

2. **Bar Chart** — Unemployment Rate by Country
   - Top 20 countries sorted by average unemployment rate
   - Color scale from green (low) to red (high)
   - Bars animate from 0 on load

3. **Bubble Chart** — GDP vs Inflation
   - X-axis: GDP per Capita (Current USD)
   - Y-axis: Inflation (CPI %)
   - Bubble size: Total GDP
   - Color by country

4. **Heatmap** — Economic Indicators Correlation
   - Pearson correlation between 8 key economic indicators
   - Color scale: Red (negative correlation) to Blue (positive)
   - Values displayed in cells
   - Interactive tooltips

5. **Scatter Plot** — Phillips Curve
   - X-axis: Unemployment Rate (%)
   - Y-axis: Inflation (CPI %)
   - Linear regression line showing relationship
   - Dots colored by year (viridis scale)
   - Zoom enabled

6. **Area Chart** — Public Debt Over Time
   - Stacked area chart of top 6 countries
   - Public Debt (% of GDP) over years
   - Gradient fills for each country
   - Click legend to toggle visibility

7. **Pie/Donut Chart** — Government Finance Breakdown
   - Shows average distribution of:
     - Government Expense (% of GDP)
     - Government Revenue (% of GDP)
     - Tax Revenue (% of GDP)
   - Interactive slices expand on hover

8. **Choropleth Map** — GDP per Capita World Map
   - Average GDP per Capita by country (2000-2022)
   - Color scale: Yellow (low) to Red (high)
   - Gray for countries with no data
   - Zoom and pan enabled
   - Interactive tooltips

## Features

### Dashboard Controls
- **Country Multi-Select**: Filter data by one or more countries
- **Year Range Slider**: Filter data by year (2000-2022)
- **Apply Filters**: Update all charts with selected filters
- **Reset Filters**: Clear all filters and show full dataset

### Chart Features
- **Responsive Design**: Charts adapt to screen size
- **Dark Theme**: Professional dark interface with color-coded variables
- **Interactive Tooltips**: Hover over elements to see detailed information
- **Smooth Animations**: Transitions for loading and data updates
- **Zoom & Pan**: Some charts support zooming and panning for exploration
- **Legend Control**: Click legends to show/hide data series

### Sidebar Navigation
- Quick links to jump to each chart section
- Professional layout with fixed sidebar
- Responsive collapse on mobile devices

## Technologies Used

- **D3.js v7**: Data visualization and charting
- **HTML5 / CSS3**: Structure and styling
- **Vanilla JavaScript**: Interactivity and data processing
- **Python 3**: Data cleaning and preprocessing
- **Pandas / NumPy / SciPy**: Data analysis
- **TopoJSON**: Geospatial data for world map
- **World Atlas**: World map topology data

## Project Structure

```
world-economy-viz/
├── venv/                          # Python virtual environment
├── data/
│   ├── world_bank_data_2025.csv   # Original dataset
│   └── economy_clean.csv          # Cleaned dataset
├── preprocessing/
│   └── clean_data.py              # Data cleaning script
├── charts/
│   ├── lineChart.js               # Line chart visualization
│   ├── barChart.js                # Bar chart visualization
│   ├── bubbleChart.js             # Bubble chart visualization
│   ├── heatmap.js                 # Correlation heatmap
│   ├── scatterPlot.js             # Scatter plot with regression
│   ├── areaChart.js               # Stacked area chart
│   ├── pieChart.js                # Donut chart
│   └── choroplethMap.js           # World choropleth map
├── index.html                     # Main HTML file
├── style.css                      # Styling
├── main.js                        # Main JavaScript logic
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

## Data Cleaning

The `clean_data.py` script performs the following operations:

1. Loads the raw CSV dataset
2. Replaces missing value indicators ("", "..", "nan") with NaN
3. Converts all numeric columns to float
4. Drops rows with >80% missing values
5. Saves cleaned data to `economy_clean.csv`
6. Prints summary statistics

## CSS Variables

The dashboard uses CSS custom properties for theming:

```css
--bg-primary: #0d1117          /* Main background */
--bg-secondary: #161b22        /* Secondary background */
--bg-card: #1f2937             /* Card background */
--accent: #58a6ff              /* Primary accent (blue) */
--accent2: #f78166             /* Secondary accent (orange) */
--text-primary: #e6edf3        /* Primary text color */
--text-secondary: #8b949e      /* Secondary text color */
--border: #30363d              /* Border color */
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Notes

- All data values are parsed and invalid entries are treated as NaN
- Charts handle missing data gracefully
- The dashboard is fully responsive and works on mobile devices
- All visualizations update in real-time when filters are applied
- The world map automatically centers and zooms to fit countries with data

## Future Enhancements

- Export charts as PNG/SVG
- Data table view with sorting and filtering
- Custom color themes
- Historical data comparison
- Time-series animation

---

**Last Updated**: June 14, 2026
