CFC:VALUE | Chelsea FC, Read as a Balance Sheet

An interactive analytics desk and companion report that applies corporate-finance frameworks to the Premier League transfer market, using Chelsea FC under Boehly-Clearlake ownership as the case study.

Live dashboard: [add your deployment link] Full report: chelsea-report.docx

What it shows
A computed transfer-price index. Built from 30+ seasons of Premier League transfer records (mean fee per season, rebased to 2000/01 = 100). The average fee has inflated roughly 7x since 2000/01, including a genuine market contraction in 2024/25 before the record 2025/26 window.
Current holdings, marked to market. Every Chelsea first-team signing at three values: fee, amortised book value, and current market value. Result: roughly €349M of unrealized gain the accounts have not recognised.
Realized P&L on closed positions. Eleven first-team exits between 2024 and 2026, priced against book value at sale. Ten of eleven closed at a profit, roughly +€273M in total, with Nkunku the only crystallised loss.
The academy as capital recycling. Homegrown players carry a zero cost basis, so 100% of any sale is accounting profit. Chelsea banked over £251M from academy sales in three seasons on that logic.
Inflation vs. goodwill. Why a €100M fee is never just a €100M fee: the market-wide tide (inflation) separated from the deal-specific premium (goodwill), with Mudryk, Caicedo and Rogers as exhibits.
The wage strategy. Low base salaries, heavy performance bonuses, and long contracts: private-equity portfolio management applied to a football squad.
Finance concepts applied

Straight-line amortisation and carrying value · impairment · realized vs. unrealized P&L · goodwill · zero cost basis · fixed-to-variable cost conversion · price indices and real-terms restatement · comparable-asset analysis.

Data sources
Premier League transfer records, 1992/93–2022/23 (public dataset built from Transfermarkt), extended with Deloitte's published summer-window spending
Transfermarkt squad valuations (2026/27) and reported transfer fees
CIES Football Observatory valuations via The Athletic (May 2024 reference points)
FootballTransfers xTV and Football Benchmark estimates (goodwill exhibits)
Reported contract terms; club coverage for wage-structure estimates

All assumptions (contract-term estimates, flat 1.15 GBP/EUR conversion, the December 2023 five-year amortisation cap and its grandfathering) are disclosed in the in-app methodology panel and the report. Figures are analytical estimates, not audited accounts.

Stack

Single-file React dashboard (no external chart libraries; all visuals are hand-built SVG). Analysis pipeline in Python/pandas for the index computation and amortisation modelling.

Author

Built by Charles Watson. Finance and football analytics. linkedin.com/in/charles-watson-1858a4353
