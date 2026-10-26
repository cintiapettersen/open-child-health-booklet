# Open Child Health Booklet

**An open-source, offline-first digital child health booklet for the first 1,000 days.**

Families record vaccines, symptoms, medications and growth in one place — and bring an organized summary to every appointment. Vaccination schedules are configurable by country, starting with Brazil's National Immunization Program (PNI).

> Status: early prototype (work in progress). Not a medical device. The booklet records and organizes information — it does not diagnose, prescribe or recommend treatment.

---

## The problem

During pediatric appointments, doctors routinely ask *when did the fever start?*, *which was the last vaccine?*, *what medication did the child take?* — and families often can't remember.

The information exists, but it is scattered: in the paper vaccination booklet, in phone photos and messages, or simply in a parent's memory. This weakens continuity of care, especially in the first 1,000 days of life, when visits are frequent and details matter — and especially for families moving between clinics, cities or public and private services.

## The solution

A lightweight digital booklet that any family can use and any clinic, developer or public health team can adopt and adapt:

- **Vaccination record** following the official national schedule (Brazil's PNI first; other countries can add their own schedule as a data file).
- **Symptoms and illness episodes** with dates and notes.
- **Medications** given at home (name, dose, time).
- **Growth measurements** (weight, length/height, head circumference).
- **Visit summary**: an organized one-page summary to show or share with the pediatrician.
- **Works without internet**: data is stored on the family's own device. No account required.
- **Family controls sharing**: nothing leaves the device unless the family chooses to export or share it.

## Design principles

1. **Offline-first** — usable with low or no connectivity; installable as a Progressive Web App.
2. **Privacy by design** — data stays on the device by default; aligned with LGPD (Brazil) and GDPR principles.
3. **Record, don't diagnose** — the booklet organizes information for families and professionals; it never gives clinical advice.
4. **Configurable by country** — schedules and content are data, not code.
5. **Simple and accessible** — plain language, large touch targets, works on low-end phones.
6. **Open** — MIT-licensed so clinics, NGOs and public services can reuse it freely.

## Architecture (planned)

```
open-child-health-booklet/
├── app/                 # Offline-first web app (PWA): UI + local storage
├── schedules/           # Vaccination schedules as JSON (e.g. br-pni.json)
├── docs/                # Architecture, data model, privacy, roadmap
└── LICENSE              # MIT
```

- **Frontend:** plain web technologies (HTML/CSS/JavaScript) packaged as a PWA — no app store needed.
- **Storage:** on-device (IndexedDB). Optional export/import (JSON/PDF) for backup or sharing.
- **Schedules:** versioned JSON files describing vaccines, doses and recommended ages per country.
- **Interoperability (roadmap):** explore standard formats (e.g. HL7 FHIR) to support future integration with public health records, always with family consent.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`ROADMAP.md`](ROADMAP.md).

## Relationship to Baby Kangoo

This project is created by the team behind [Baby Kangoo](https://babykangoo.app), a family app that combines child health records and childhood memories.

The **Open Child Health Booklet is an independent, open-source module**, written from scratch and released under the MIT license. Baby Kangoo remains a separate commercial product; the booklet can be used on its own by anyone, and Baby Kangoo may adopt it as a component.

## Pilot (planned)

First pilot in **Brazil**, with pediatric clinics and families served by **SUS**, Brazil's public health system, focusing on the first 1,000 days and on low-connectivity settings.

## Contributing

Contributions are welcome — especially vaccination schedules for other countries, translations and accessibility improvements. Please open an issue to discuss ideas.

## License

[MIT](LICENSE) © 2026 Cintia Pettersen
