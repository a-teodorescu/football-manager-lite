# Sponsorships & Commercial Deals

Version 2.5.0 adds a lightweight commercial layer for Football Manager Lite.

## What it adds

- Sponsorship offers generated deterministically per season, round and club state.
- Active sponsorship deals by category: main, shirt, stadium, youth and regional.
- Signing bonus added immediately to club cash.
- Base income added to every league-round finance report.
- Win bonus and objective bonus when conditions are met.
- Sponsor refresh action once per round.
- Sponsorship history saved in the same per-user payload.
- Inbox messages for signed deals, refreshed offers, expired deals and sponsorship income.

## Design goal

The system gives Finance another gameplay lever without introducing heavy backend tables or slowing Netlify builds. Everything remains inside the existing save payload.
