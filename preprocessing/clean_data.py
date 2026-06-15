import pandas as pd
import numpy as np
import os
import sys

# ─────────────────────────────────────────────
# 0. SETUP — point to project root
# ─────────────────────────────────────────────
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(project_root)

INPUT_FILE  = "data/world_bank_data_2025.csv"
OUTPUT_FILE = "data/economy_clean.csv"
LOG_FILE    = "data/cleaning_report.txt"

# Columns that must never be treated as numeric
ID_COLS = ["country_name", "country_id", "year"]

# All expected economic indicator columns
INDICATOR_COLS = [
    "Inflation (CPI %)",
    "GDP (Current USD)",
    "GDP per Capita (Current USD)",
    "Unemployment Rate (%)",
    "Interest Rate (Real, %)",
    "Inflation (GDP Deflator, %)",
    "GDP Growth (% Annual)",
    "Current Account Balance (% GDP)",
    "Government Expense (% of GDP)",
    "Government Revenue (% of GDP)",
    "Tax Revenue (% of GDP)",
    "Gross National Income (USD)",
    "Public Debt (% of GDP)",
]

# Known outlier thresholds (realistic economic bounds)
OUTLIER_BOUNDS = {
    "Inflation (CPI %)":                 (-50,    500),
    "GDP (Current USD)":                 (0,      None),   # must be positive
    "GDP per Capita (Current USD)":      (0,      None),
    "Unemployment Rate (%)":             (0,      100),
    "Interest Rate (Real, %)":           (-100,   200),
    "Inflation (GDP Deflator, %)":       (-50,    500),
    "GDP Growth (% Annual)":             (-80,    100),
    "Current Account Balance (% GDP)":   (-150,   150),
    "Government Expense (% of GDP)":     (0,      150),
    "Government Revenue (% of GDP)":     (0,      150),
    "Tax Revenue (% of GDP)":            (0,      100),
    "Gross National Income (USD)":       (0,      None),
    "Public Debt (% of GDP)":            (0,      None),
}

log_lines = []

def log(msg=""):
    """Print to console and save to log."""
    print(msg)
    log_lines.append(str(msg))

# ─────────────────────────────────────────────
# 1. LOAD
# ─────────────────────────────────────────────
log("=" * 60)
log("  WORLD BANK DATA — CLEANING PIPELINE")
log("=" * 60)

if not os.path.exists(INPUT_FILE):
    log(f"\n❌ ERROR: File not found: {INPUT_FILE}")
    log("   Make sure you are running from the project root.")
    sys.exit(1)

log(f"\n📂 Loading: {INPUT_FILE}")
df = pd.read_csv(INPUT_FILE, low_memory=False)
log(f"   Raw shape: {df.shape[0]:,} rows × {df.shape[1]} columns")

# ─────────────────────────────────────────────
# 2. STANDARDISE COLUMN NAMES
# ─────────────────────────────────────────────
# Strip leading/trailing whitespace from column names
df.columns = df.columns.str.strip()

log(f"\n📋 Columns found ({len(df.columns)}):")
for c in df.columns:
    log(f"   • {c}")

# ─────────────────────────────────────────────
# 3. REPLACE ALL MISSING-VALUE PLACEHOLDERS
# ─────────────────────────────────────────────
MISSING_MARKERS = ["..", "...", "NA", "N/A", "n/a", "na",
                   "nan", "NaN", "NULL", "null", "", " ", "#N/A"]

log("\n🔄 Replacing missing-value placeholders...")
before_nulls = df.isna().sum().sum()
df = df.replace(MISSING_MARKERS, np.nan)

# Also replace any cell that is only whitespace
df = df.applymap(lambda x: np.nan if isinstance(x, str) and x.strip() == "" else x)
after_nulls = df.isna().sum().sum()
log(f"   NaN count before: {before_nulls:,}  →  after: {after_nulls:,}")

# ─────────────────────────────────────────────
# 4. ENSURE ID COLUMNS ARE CORRECT TYPES
# ─────────────────────────────────────────────
log("\n🔑 Processing ID columns...")
if "country_name" in df.columns:
    df["country_name"] = df["country_name"].astype(str).str.strip()
if "country_id" in df.columns:
    df["country_id"] = df["country_id"].astype(str).str.strip().str.lower()
if "year" in df.columns:
    df["year"] = pd.to_numeric(df["year"], errors="coerce")
    invalid_years = df["year"].isna().sum()
    if invalid_years:
        log(f"   ⚠ {invalid_years} rows with invalid year — dropping")
        df = df.dropna(subset=["year"])
    df["year"] = df["year"].astype(int)
    log(f"   Year range: {df['year'].min()} – {df['year'].max()}")

# ─────────────────────────────────────────────
# 5. CONVERT INDICATORS TO NUMERIC
# ─────────────────────────────────────────────
log("\n🔢 Converting indicator columns to numeric...")
present_indicators = [c for c in INDICATOR_COLS if c in df.columns]
missing_indicators  = [c for c in INDICATOR_COLS if c not in df.columns]

if missing_indicators:
    log(f"   ⚠ These expected columns are NOT in the file:")
    for c in missing_indicators:
        log(f"      – {c}")

for col in present_indicators:
    before = df[col].isna().sum()
    df[col] = pd.to_numeric(df[col], errors="coerce")
    after  = df[col].isna().sum()
    new_nans = after - before
    if new_nans > 0:
        log(f"   {col}: {new_nans} non-numeric values → NaN")

# ─────────────────────────────────────────────
# 6. DROP DUPLICATE ROWS
# ─────────────────────────────────────────────
log("\n🗑  Removing duplicate rows...")
before_dedup = len(df)
df = df.drop_duplicates()
dupes_removed = before_dedup - len(df)
log(f"   Duplicates removed: {dupes_removed:,}")

# Drop duplicate (country, year) pairs — keep first
key_cols = [c for c in ["country_name", "country_id", "year"] if c in df.columns]
if key_cols:
    before = len(df)
    df = df.drop_duplicates(subset=key_cols, keep="first")
    log(f"   Duplicate (country, year) pairs removed: {before - len(df):,}")

# ─────────────────────────────────────────────
# 7. DROP ROWS WITH EXCESSIVE MISSING DATA (>80%)
# ─────────────────────────────────────────────
log("\n🧹 Dropping rows where >80% of indicator columns are NaN...")
before = len(df)
if present_indicators:
    # Count NaNs only in indicator columns
    nan_ratio = df[present_indicators].isna().sum(axis=1) / len(present_indicators)
    df = df[nan_ratio <= 0.80]
rows_dropped = before - len(df)
log(f"   Rows dropped: {rows_dropped:,}  |  Remaining: {len(df):,}")

# ─────────────────────────────────────────────
# 8. OUTLIER DETECTION & CAPPING (Winsorisation)
# ─────────────────────────────────────────────
log("\n📊 Outlier handling (IQR + domain bounds)...")

outlier_report = []

for col in present_indicators:
    series = df[col].dropna()
    if len(series) == 0:
        continue

    # --- Domain-bound clipping ---
    lo_bound, hi_bound = OUTLIER_BOUNDS.get(col, (None, None))
    domain_clipped = 0
    if lo_bound is not None:
        n = (df[col] < lo_bound).sum()
        df.loc[df[col] < lo_bound, col] = np.nan   # set impossible values to NaN
        domain_clipped += n
    if hi_bound is not None:
        n = (df[col] > hi_bound).sum()
        df.loc[df[col] > hi_bound, col] = np.nan
        domain_clipped += n

    # --- IQR-based outlier capping (Winsorise at 1.5 × IQR) ---
    Q1  = df[col].quantile(0.25)
    Q3  = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower_fence = Q1 - 3.0 * IQR   # use 3× for economic data (high natural variance)
    upper_fence = Q3 + 3.0 * IQR

    iqr_outliers = ((df[col] < lower_fence) | (df[col] > upper_fence)).sum()
    df[col] = df[col].clip(lower=lower_fence, upper=upper_fence)

    if domain_clipped > 0 or iqr_outliers > 0:
        outlier_report.append(
            f"   {col}: {domain_clipped} domain-invalid → NaN | {iqr_outliers} IQR outliers capped"
        )

if outlier_report:
    for line in outlier_report:
        log(line)
else:
    log("   No significant outliers detected.")

# ─────────────────────────────────────────────
# 9. IMPUTE MISSING VALUES (per country, time interpolation)
# ─────────────────────────────────────────────
log("\n🔧 Imputing missing values (time-based interpolation per country)...")

if "country_name" in df.columns and "year" in df.columns:
    df = df.sort_values(["country_name", "year"])

    before_missing = df[present_indicators].isna().sum().sum()

    def interpolate_group(group):
        group = group.set_index("year")
        for col in present_indicators:
            if col in group.columns:
                # Linear interpolation within time series
                group[col] = group[col].interpolate(method="linear", limit=3)
                # Forward fill then backward fill for edges (max 2 steps)
                group[col] = group[col].ffill(limit=2).bfill(limit=2)
        return group.reset_index()

    df = df.groupby("country_name", group_keys=False).apply(interpolate_group)
    after_missing = df[present_indicators].isna().sum().sum()
    imputed = before_missing - after_missing
    log(f"   Values imputed: {imputed:,}")
    log(f"   Remaining NaNs in indicators: {after_missing:,}")

# ─────────────────────────────────────────────
# 10. RESET INDEX & SORT
# ─────────────────────────────────────────────
df = df.sort_values(["country_name", "year"]).reset_index(drop=True)

# ─────────────────────────────────────────────
# 11. FINAL MISSING VALUE REPORT
# ─────────────────────────────────────────────
log("\n📉 Final missing value counts per column:")
missing_final = df.isna().sum()
missing_final = missing_final[missing_final > 0].sort_values(ascending=False)
if len(missing_final) > 0:
    for col, cnt in missing_final.items():
        pct = cnt / len(df) * 100
        log(f"   {col}: {cnt:,} ({pct:.1f}%)")
else:
    log("   ✅ No missing values remaining!")

# ─────────────────────────────────────────────
# 12. SUMMARY STATISTICS
# ─────────────────────────────────────────────
log("\n📈 Summary statistics for key indicators:")
if present_indicators:
    stats = df[present_indicators].describe().round(3)
    log(stats.to_string())

log(f"\n🌍 Countries in cleaned dataset: {df['country_name'].nunique() if 'country_name' in df.columns else 'N/A'}")
log(f"📅 Year range: {df['year'].min()} – {df['year'].max()}" if 'year' in df.columns else "")
log(f"📦 Final shape: {df.shape[0]:,} rows × {df.shape[1]} columns")

# ─────────────────────────────────────────────
# 13. SAVE OUTPUT
# ─────────────────────────────────────────────
os.makedirs("data", exist_ok=True)
df.to_csv(OUTPUT_FILE, index=False)
log(f"\n✅ Done! Saved to {OUTPUT_FILE}")

# Save cleaning log
with open(LOG_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(log_lines))
log(f"📝 Cleaning report saved to {LOG_FILE}")
log("=" * 60)