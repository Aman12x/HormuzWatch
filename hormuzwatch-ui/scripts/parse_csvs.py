#!/usr/bin/env python3
"""
parse_csvs.py — HormuzWatch UI data generator
Reads data/processed/country_impact.csv and writes src/data/geoImpact.js

Usage (from hormuzwatch-ui/):
    python3 scripts/parse_csvs.py
"""

import csv
import json
import sys
from pathlib import Path

ROOT    = Path(__file__).resolve().parents[2]   # hormuzwatch/
CSV_IN  = ROOT / 'data' / 'processed' / 'country_impact.csv'
JS_OUT  = Path(__file__).resolve().parents[1] / 'src' / 'data' / 'geoImpact.js'

def parse_row(r):
    return {
        'country':                    r['country'],
        'iso3':                       r['iso3'],
        'iso_numeric':                int(r['iso_numeric']),
        'lat':                        float(r['lat']),
        'lon':                        float(r['lon']),
        'hormuz_oil_dependency_pct':  int(r['hormuz_oil_dependency_pct']),
        'fertilizer_import_exposure': r['fertilizer_import_exposure'],
        'refugee_impact':             r['refugee_impact'],
        'trade_with_iran_usd_bn':     float(r['trade_with_iran_usd_bn']),
        'war_proximity':              r['war_proximity'],
        'economy_score':              float(r['economy_score']),
        'war_score':                  float(r['war_score']),
        'overall_impact_score':       float(r['overall_impact_score']),
        'notes':                      r['notes'],
    }

def main():
    if not CSV_IN.exists():
        print(f'ERROR: {CSV_IN} not found', file=sys.stderr)
        sys.exit(1)

    with open(CSV_IN) as f:
        rows = [parse_row(r) for r in csv.DictReader(f)]

    js  = '// Auto-generated from data/processed/country_impact.csv\n'
    js += '// Run hormuzwatch-ui/scripts/parse_csvs.py to regenerate\n\n'
    js += 'export const countryData = ' + json.dumps(rows, indent=2) + '\n\n'
    js += 'export const dataByIso3 = Object.fromEntries(countryData.map(d => [d.iso3, d]))\n'
    js += 'export const dataByNumeric = Object.fromEntries(countryData.map(d => [String(d.iso_numeric), d]))\n'

    JS_OUT.write_text(js)
    print(f'Written {len(rows)} countries → {JS_OUT}')

if __name__ == '__main__':
    main()
