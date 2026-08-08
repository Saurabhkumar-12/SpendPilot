# SpendPilot Architecture Guide

---

## 1. System Overview

SpendPilot decouples client rendering from server data operations using a modern REST API interface.

```
┌─────────────────────────┐       JSON API       ┌─────────────────────────┐
│   React + Vite Client   │ ───────────────────> │   Express API Backend   │
│  (Tailwind, Context)    │ <─────────────────── │ (Rate Limit, Helmet)    │
└─────────────────────────┘                      └────────────┬────────────┘
                                                              │
                                                              ▼
                                                 ┌─────────────────────────┐
                                                 │ Relational Data Engine  │
                                                 │   (WAL Mode, Atomic)    │
                                                 └─────────────────────────┘
```

---

## 2. Debt Simplification Solver Mechanics

The Settlement Engine evaluates user directional net balances and solves for the minimal graph:
$$\text{NetBalance}_i = \text{Paid}_i - \text{Owed}_i + \text{SettledReceived}_i - \text{SettledPaid}_i$$

Greedy pairing matches max debtor with max creditor, guaranteeing minimal transaction count.
