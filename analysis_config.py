"""Shared dates for the closed HormuzWatch analysis window."""

from datetime import date, timedelta

CONFLICT_START = date(2026, 2, 28)
HORMUZ_CLOSURE = date(2026, 3, 7)
HORMUZ_REOPENED = date(2026, 6, 18)

# Public reporting treats reopening day as the final observation. Yahoo Finance's
# ``end`` argument is exclusive, so its download boundary is the following day.
ANALYSIS_END = HORMUZ_REOPENED.isoformat()
YFINANCE_END = (HORMUZ_REOPENED + timedelta(days=1)).isoformat()

