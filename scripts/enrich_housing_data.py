import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
csv_path = BASE_DIR / "data/processed/housing_macro_quarterly.csv"

df = pd.read_csv(csv_path)

df['year'] = df['year'].astype(int)
df['quarter'] = df['quarter'].astype(str)
df = df.sort_values(['country','year','quarter'])

quarter_map = {'Q1':'01','Q2':'04','Q3':'07','Q4':'10'}
df['date'] = pd.to_datetime(df['year'].astype(str) + '-' + df['quarter'].map(quarter_map) + '-01')

# -----------------------
# Calculate QoQ changes
# -----------------------
df = df.sort_values(['country','date'])
for col in ['hpi','inflation','interest_rate']:
    df[col + '_qoq_change'] = df.groupby('country')[col].pct_change() * 100

# -----------------------
# Calculate YoY changes
# -----------------------
for col in ['hpi','inflation','interest_rate']:
    df[col + '_yoy_change'] = df.groupby('country')[col].pct_change(4) * 100

df = df.round({
    'hpi_qoq_change': 2,
    'hpi_yoy_change': 2,
    'inflation_qoq_change': 2,
    'inflation_yoy_change': 2,
    'interest_rate_qoq_change': 2,
    'interest_rate_yoy_change': 2
})

output_path = BASE_DIR / "data/enriched/housing_macro_quarterly_enriched.csv"
df.to_csv(output_path, index=False)
print(f"DONE → {output_path}")
