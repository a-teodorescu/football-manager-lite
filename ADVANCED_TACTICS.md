# v3.9.0 — Advanced Tactics

This release expands the simple formation / mentality / pressing system into a richer tactical layer while keeping the deterministic match engine philosophy.

## New tactical controls

- Tempo: slow, normal, fast
- Width: narrow, balanced, wide
- Risk: safe, balanced, risky
- Defensive line: deep, standard, high
- Attacking focus: balanced, left, right, central

The old tactic shape is still compatible. Older saves are normalized automatically through defaults.

## Tactical report

The new Advanced Tactics report calculates:

- adjusted attack / midfield / defense / goalkeeper / overall strength
- tactical score
- risk score and risk label
- warnings for risky combinations
- role suitability for the best XI
- recommendations based on squad attributes and player fitness

## Design notes

This is a tactical overlay rather than a rewrite. The base match engine still works with existing `Tactic` objects. Advanced values are optional and deterministic.
