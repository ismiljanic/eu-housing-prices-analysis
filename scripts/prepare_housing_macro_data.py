import pandas as pd
from pathlib import Path

# -----------------------
# 0. PATHS
# -----------------------
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data/raw"
PROCESSED_DIR = BASE_DIR / "data/processed"
PROCESSED_DIR.mkdir(exist_ok=True, parents=True)

# -----------------------
# 1. LOAD DATA
# -----------------------
hpi = pd.read_csv(RAW_DIR / "hpi_eurostat_prc_hpi_q.csv", sep=",")
hicp = pd.read_csv(RAW_DIR / "hicp_eurostat_prc_hicp_manr.csv", sep=",", low_memory=False)
rates = pd.read_csv(RAW_DIR / "ecb_deposit_facility_rate.csv", sep=",")

# -----------------------
# 2. CLEAN HPI
# -----------------------
hpi = hpi[['unit','geo','TIME_PERIOD','OBS_VALUE']].copy()
hpi = hpi.rename(columns={'TIME_PERIOD':'period','OBS_VALUE':'hpi'})
hpi = hpi[hpi['unit'].str.startswith('I15')]
hpi['hpi'] = pd.to_numeric(hpi['hpi'], errors='coerce')
hpi[['year','quarter']] = hpi['period'].str.split('-Q', expand=True)
hpi['quarter'] = 'Q' + hpi['quarter']
hpi = hpi.rename(columns={'geo':'country'})[['country','year','quarter','hpi']]

# -----------------------
# ENSURE TYPES FOR MERGE
# -----------------------
hpi['year'] = hpi['year'].astype(int)
hpi['quarter'] = hpi['quarter'].astype(str)

# -----------------------
# 3. CLEAN HICP (MONTHLY → QUARTERLY)
# -----------------------
hicp = hicp[['unit','coicop','geo','TIME_PERIOD','OBS_VALUE']].copy()
hicp = hicp.rename(columns={'TIME_PERIOD':'date','OBS_VALUE':'inflation'})
hicp = hicp[(hicp['coicop'] == 'CP00') & (hicp['unit'] == 'RCH_A')]
hicp['inflation'] = pd.to_numeric(hicp['inflation'], errors='coerce')
hicp['date'] = pd.to_datetime(hicp['date'])
hicp['year'] = hicp['date'].dt.year
hicp['quarter'] = hicp['date'].dt.to_period('Q').astype(str).str[-2:]

hicp_q = (
    hicp.groupby(['geo','year','quarter'])['inflation']
    .mean()
    .reset_index()
    .rename(columns={'geo':'country'})
)

# -----------------------
# ENSURE TYPES FOR MERGE
# -----------------------
hicp_q['year'] = hicp_q['year'].astype(int)
hicp_q['quarter'] = hicp_q['quarter'].astype(str)

# -----------------------
# 4. CLEAN ECB RATES (ALREADY QUARTERLY)
# -----------------------
rates['observation_date'] = pd.to_datetime(rates['observation_date'])
rates['year'] = rates['observation_date'].dt.year
rates['quarter'] = rates['observation_date'].dt.to_period('Q').astype(str).str[-2:]

rates_q = (
    rates.groupby(['year','quarter'])['ECBDFR']
    .mean()
    .reset_index()
    .rename(columns={'ECBDFR':'interest_rate'})
)

# -----------------------
# ENSURE TYPES FOR MERGE
# -----------------------
rates_q['year'] = rates_q['year'].astype(int)
rates_q['quarter'] = rates_q['quarter'].astype(str)

# -----------------------
# 5. MERGE EVERYTHING
# -----------------------
final = (
    hpi
    .merge(hicp_q, on=['country','year','quarter'], how='left')
    .merge(rates_q, on=['year','quarter'], how='left')
)

# -----------------------
# 6. SAVE FINAL DATASET
# -----------------------
final.to_csv(PROCESSED_DIR / "housing_macro_quarterly.csv", index=False)
print(f"DONE → {PROCESSED_DIR / 'housing_macro_quarterly.csv'}")
