# Stadium & Facilities

Version `2.6.0` adds a lightweight infrastructure layer for the manager career.

## Facilities included

- Stadium capacity
- Fan experience
- Training ground
- Medical center
- Academy campus
- Commercial zone

## Gameplay impact

- Capacity and fan experience increase projected attendance and home matchday upside.
- Commercial zone adds recurring commercial income every league round.
- Training ground adds a deterministic bonus to training sessions.
- Academy campus reduces academy upkeep in round finance reports.
- Medical center exposes an injury-risk reduction metric for future balancing.
- Every facility has an upgrade cost and maintenance cost.

## Save/load

The facilities state and history are stored in the regular manager save payload, so it works with local save and Supabase save/load per authenticated user.

## Validation

Run:

```bash
npm run facilities
```

This validates upgrade options, upgrade cost, projected attendance and facility impact.
