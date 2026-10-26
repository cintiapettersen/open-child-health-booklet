# Architecture

## Overview
A static Progressive Web App. All logic runs in the browser; data is stored locally in IndexedDB. No server is required to use the booklet.

## Data model (draft)
- **Child**: id, name, birth date, sex (optional), country schedule.
- **VaccineDose**: vaccine id, dose label, date given, place/provider (optional), lot (optional), notes.
- **SymptomEpisode**: start/end dates, symptoms, temperature readings, notes.
- **Medication**: name, dose, date/time, related episode (optional).
- **Measurement**: date, weight (kg), length/height (cm), head circumference (cm).
- **VisitSummary**: generated on demand from the records above for a chosen period.

## Vaccination schedules
Stored as JSON in `/schedules`, one file per country/program, versioned with source and date. Example entry:

```json
{ "id": "bcg", "name": "BCG", "doses": [{ "label": "Single dose", "ageMonths": 0 }] }
```

Schedules are informational and must be reviewed against the official source before each release.

## Privacy
- Local-only storage by default; no tracking, no third-party analytics.
- Export/import is explicit and user-initiated.
- Any future sync or integration will be opt-in and documented.
