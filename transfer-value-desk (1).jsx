import { useState, useMemo } from "react";
import { Search, TrendingUp, TrendingDown, Minus, X, Info, ArrowRight, Rocket, GraduationCap, Wallet, AlertTriangle } from "lucide-react";

const TOK = {
  bg: "#0E1115", panel: "#161A20", panel2: "#1B2129",
  border: "#262B33", borderStrong: "#333A45",
  ink: "#E8ECF1", inkSoft: "#9FB0C3", inkMute: "#616D7D",
  blue: "#3B82F6", rise: "#1FD08A", fall: "#E5484D",
  amber: "#E8A33D", orange: "#FF9B54",
};
const MONO = "'IBM Plex Mono', monospace";
const HEAD = "'Space Grotesk', sans-serif";
const BODY = "'Inter', sans-serif";

const ticker = (n) => n.split(" ").slice(-1)[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
const fmtEUR = (v) => `€${Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1)}M`;

// ============================================================================
// CURRENT HOLDINGS - Chelsea first-team signings still at the club, Aug 2026.
// Fees: Transfermarkt-reported. Market values: playmakerstats/Transfermarkt
// squad table (2026/27) where listed; (e) = estimate where the table row
// wasn't available. Book value: straight-line amortisation from signing date
// to Aug 2026. Deals signed after the Dec 2023 PL rule amortise over max 5
// years regardless of contract length; earlier deals use full contract term
// (grandfathered). Contract terms marked * are confirmed.
// ============================================================================
const HOLDINGS = [
  { name: "Cole Palmer", fee: 46.0, book: 32.7, mkt: 105.0, yrs: "10yr*", est: false },
  { name: "Enzo Fernández", fee: 122.7, book: 71.5, mkt: 105.0, yrs: "8.5yr*", est: false },
  { name: "Moisés Caicedo", fee: 115.0, book: 71.9, mkt: 90.0, yrs: "8yr*", est: false },
  { name: "Morgan Rogers", fee: 135.0, book: 133.7, mkt: 110.0, yrs: "5yr cap", est: false },
  { name: "João Pedro", fee: 60.0, book: 46.8, mkt: 78.0, yrs: "5yr cap", est: false },
  { name: "Estêvão", fee: 29.0, book: 22.6, mkt: 76.0, yrs: "5yr cap", est: false },
  { name: "Jamie Gittens", fee: 48.5, book: 37.8, mkt: 45.0, yrs: "5yr cap", est: true },
  { name: "Jorrel Hato", fee: 40.7, book: 31.7, mkt: 45.0, yrs: "5yr cap", est: true },
  { name: "Pedro Neto", fee: 62.0, book: 37.2, mkt: 60.0, yrs: "5yr cap", est: true },
  { name: "Reece James", fee: 0, book: 0, mkt: 58.0, yrs: "academy", academy: true, est: false },
  { name: "Levi Colwill", fee: 0, book: 0, mkt: 45.0, yrs: "academy", academy: true, est: true },
  { name: "Wesley Fofana", fee: 80.5, book: 34.5, mkt: 30.0, yrs: "7yr*", est: true },
  { name: "Romeo Lavia", fee: 60.9, book: 34.8, mkt: 30.0, yrs: "7yr", est: true },
  { name: "Robert Sánchez", fee: 28.7, book: 16.2, mkt: 25.0, yrs: "7yr", est: true },
  { name: "Malo Gusto", fee: 32.8, book: 18.3, mkt: 35.0, yrs: "7yr", est: true },
  { name: "Dário Essugo", fee: 18.5, book: 14.4, mkt: 16.0, yrs: "5yr cap", est: false },
  { name: "Mykhailo Mudryk", fee: 71.3, book: 41.5, mkt: null, yrs: "8.5yr*", suspended: true, est: false },
].map((d) => ({ ...d, gap: d.mkt !== null ? d.mkt - d.book : null }));

// ============================================================================
// REALIZED P&L - positions closed in 2024-2026. Accounting profit on a sale
// = price minus remaining book value at the time of sale. Sale prices as
// reported (GBP converted at 1.15 where needed); book-at-sale computed on
// the same amortisation basis as above.
// ============================================================================
const EXITS = [
  { name: "Andrey Santos", to: "Man United", year: 2026, price: 55.2, bookAtSale: 7.5, pl: 47.7 },
  { name: "Conor Gallagher", to: "Atlético", year: 2024, price: 39.1, bookAtSale: 0, pl: 39.1, academy: true },
  { name: "Nicolas Jackson", to: "Bayern", year: 2026, price: 54.6, bookAtSale: 18.1, pl: 36.5 },
  { name: "Marc Cucurella", to: "Real Madrid", year: 2026, price: 59.6, bookAtSale: 23.6, pl: 36.0 },
  { name: "Liam Delap", to: "Nottm Forest", year: 2026, price: 57.5, bookAtSale: 23.7, pl: 33.8 },
  { name: "Noni Madueke", to: "Arsenal", year: 2025, price: 49.8, bookAtSale: 19.4, pl: 30.4 },
  { name: "Trevoh Chalobah", to: "Como", year: 2026, price: 29.6, bookAtSale: 0, pl: 29.6, academy: true },
  { name: "Djordje Petrović", to: "Bournemouth", year: 2025, price: 25.7, bookAtSale: 10.7, pl: 15.0 },
  { name: "Lesley Ugochukwu", to: "Burnley", year: 2025, price: 25.6, bookAtSale: 18.4, pl: 7.2 },
  { name: "Carney Chukwuemeka", to: "Dortmund", year: 2025, price: 17.8, bookAtSale: 11.9, pl: 5.9 },
  { name: "Christopher Nkunku", to: "AC Milan", year: 2025, price: 32.9, bookAtSale: 40.6, pl: -7.7 },
];

// Academy sales - zero cost basis, 100% of price lands as accounting profit.
const ACADEMY_SALES = [
  { name: "Mason Mount", to: "Man United", fee: 63.3, year: 2023 },
  { name: "Ian Maatsen", to: "Aston Villa", fee: 43.1, year: 2024 },
  { name: "Conor Gallagher", to: "Atlético Madrid", fee: 39.1, year: 2024 },
  { name: "Lewis Hall", to: "Newcastle", fee: 32.2, year: 2023 },
  { name: "Trevoh Chalobah", to: "Como", fee: 29.6, year: 2026 },
  { name: "Tyrique George", to: "Everton", fee: 20.7, year: 2026 },
  { name: "Armando Broja", to: "Burnley", fee: 20.5, year: 2025 },
];

// --- Searchable board: current Chelsea squad (sourced values) + comparison
// names from around the league (approximate estimates, illustrative trends).
const AGES = {
  "Cole Palmer": 24, "Enzo Fernández": 25, "Moisés Caicedo": 24, "Morgan Rogers": 24,
  "João Pedro": 24, "Estêvão": 19, "Jamie Gittens": 21, "Jorrel Hato": 20, "Pedro Neto": 26,
  "Reece James": 26, "Levi Colwill": 23, "Wesley Fofana": 25, "Romeo Lavia": 22,
  "Robert Sánchez": 28, "Malo Gusto": 23, "Dário Essugo": 21,
};
const CHELSEA_BOARD = HOLDINGS.filter((d) => !d.suspended).map((d, i) => ({
  id: 100 + i, name: d.name, club: "Chelsea",
  pos: ["Cole Palmer", "Enzo Fernández", "Moisés Caicedo", "Romeo Lavia", "Dário Essugo", "Malo Gusto"].includes(d.name) ? "MF"
    : ["João Pedro", "Estêvão", "Jamie Gittens", "Pedro Neto", "Morgan Rogers"].includes(d.name) ? "FW"
    : ["Robert Sánchez"].includes(d.name) ? "GK" : "DF",
  age: AGES[d.name] || 23, value: d.mkt,
  chg: d.fee > 0 ? ((d.mkt - d.fee) / d.fee) * 100 : 0,
  perf: Math.min(96, Math.max(40, Math.round(d.mkt * 0.75))),
  trend: d.mkt >= d.fee ? [30, 42, 56, 70, 84, 100] : [100, 84, 68, 55, 45, 40],
}));

const OTHER_PLAYERS = [
  { id: 1, name: "Erling Haaland", club: "Manchester City", pos: "FW", age: 25, value: 180, chg: -10.0, perf: 96, trend: [58, 66, 78, 90, 96, 100] },
  { id: 2, name: "Bukayo Saka", club: "Arsenal", pos: "FW", age: 23, value: 150, chg: 4.0, perf: 90, trend: [40, 52, 65, 78, 88, 100] },
  { id: 4, name: "Declan Rice", club: "Arsenal", pos: "MF", age: 26, value: 120, chg: 9.1, perf: 82, trend: [45, 55, 66, 78, 88, 100] },
  { id: 11, name: "Elliot Anderson", club: "Manchester City", pos: "MF", age: 23, value: 133, chg: 46.0, perf: 71, trend: [20, 28, 38, 52, 90, 100] },
  { id: 19, name: "Alexander Isak", club: "Liverpool", pos: "FW", age: 26, value: 130, chg: 4.0, perf: 88, trend: [70, 78, 86, 92, 98, 100] },
  { id: 20, name: "Florian Wirtz", club: "Liverpool", pos: "MF", age: 23, value: 128, chg: -1.5, perf: 80, trend: [90, 94, 98, 100, 96, 94] },
  { id: 26, name: "Mohamed Salah", club: "Liverpool", pos: "FW", age: 33, value: 50, chg: -22.0, perf: 66, trend: [95, 88, 78, 66, 58, 52] },
];
const PLAYERS = [...CHELSEA_BOARD, ...OTHER_PLAYERS];

// --- Real transfer-market inflation index (computed; see methodology) -------
const INFLATION_INDEX = [
  { season: "92/93", idx: 19.7, real: true }, { season: "94/95", idx: 37.3, real: true },
  { season: "96/97", idx: 50.4, real: true }, { season: "98/99", idx: 71.4, real: true },
  { season: "00/01", idx: 100.0, real: true }, { season: "02/03", idx: 105.7, real: true },
  { season: "04/05", idx: 103.3, real: true }, { season: "06/07", idx: 95.8, real: true },
  { season: "08/09", idx: 139.1, real: true }, { season: "10/11", idx: 145.9, real: true },
  { season: "12/13", idx: 142.5, real: true }, { season: "14/15", idx: 217.7, real: true },
  { season: "16/17", idx: 275.7, real: true }, { season: "18/19", idx: 306.2, real: true },
  { season: "20/21", idx: 329.0, real: true }, { season: "21/22", idx: 377.6, real: true },
  { season: "22/23", idx: 440.8, real: true }, { season: "23/24", idx: 542.0, real: false },
  { season: "24/25", idx: 478.0, real: false }, { season: "25/26", idx: 709.0, real: false },
];
const CURRENT_INDEX = INFLATION_INDEX[INFLATION_INDEX.length - 1].idx;
const DEFLATOR = CURRENT_INDEX / 100;

const CASE_STUDIES = [
  { name: "Alan Shearer", year: "1996/97", club: "→ Newcastle", nominal: 15, adjusted: 223.3 },
  { name: "Rio Ferdinand", year: "2002/03", club: "→ Man United", nominal: 33.3, adjusted: 187.1 },
];

const BRITISH_RECORD_CHAIN = [
  { name: "Jack Grealish", date: "Aug 2021", fee: 115 },
  { name: "Elliot Anderson", date: "Jul 2, 2026", fee: 133 },
  { name: "Morgan Rogers", date: "Jul 22, 2026", fee: 135 },
];

const TIER_STYLE = {
  "Blue-Chip": { bg: "#2A2210", fg: TOK.amber }, "Growth Asset": { bg: "#0F2A22", fg: TOK.rise },
  "Value Play": { bg: "#132B33", fg: "#4DD4E0" }, "Mature Holding": { bg: "#2E1518", fg: TOK.fall },
  "Core Holding": { bg: "#1B2129", fg: TOK.inkSoft }, "Rocket": { bg: "#2A1810", fg: TOK.orange },
};
function tierOf(p) {
  if (p.chg >= 40) return "Rocket";
  if (p.value >= 100) return "Blue-Chip";
  if (p.age <= 24 && p.chg > 8) return "Growth Asset";
  if (p.age >= 31) return "Mature Holding";
  if (p.perf / p.value > 1.3) return "Value Play";
  return "Core Holding";
}

function Sparkline({ trend, color }) {
  const w = 90, h = 26, pad = 3;
  const min = Math.min(...trend), max = Math.max(...trend), span = max - min || 1;
  const pts = trend.map((v, i) => `${(pad + (i * (w - pad * 2)) / (trend.length - 1)).toFixed(1)},${(h - pad - ((v - min) / span) * (h - pad * 2)).toFixed(1)}`);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="2" fill={color} />
    </svg>
  );
}
function ChangeTag({ chg }) {
  const pos = chg > 0.05, neg = chg < -0.05;
  const color = pos ? TOK.rise : neg ? TOK.fall : TOK.inkMute;
  const Icon = pos ? TrendingUp : neg ? TrendingDown : Minus;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color, fontSize: 12, fontWeight: 600, fontFamily: MONO }}>
      <Icon size={12} strokeWidth={2.4} />{chg > 0 ? "+" : ""}{chg.toFixed(1)}%
    </span>
  );
}
function Badge({ tier }) {
  const s = TIER_STYLE[tier];
  return <span style={{ background: s.bg, color: s.fg, fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.2, fontFamily: MONO }}>{tier.toUpperCase()}</span>;
}
const comps = (player, all) => all.filter((p) => p.id !== player.id && p.pos === player.pos)
  .sort((a, b) => Math.abs(a.value - player.value) - Math.abs(b.value - player.value)).slice(0, 3);

function SectionCard({ children }) {
  return <div style={{ background: TOK.panel, border: `1px solid ${TOK.border}`, borderRadius: 10, padding: "18px 20px", marginBottom: 20 }}>{children}</div>;
}
function SectionHeader({ num, title, tag }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
      <div style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 16, color: TOK.ink }}>
        {num && <span style={{ color: TOK.blue, fontFamily: MONO, fontSize: 13, marginRight: 8 }}>{num}</span>}{title}
      </div>
      {tag && <div style={{ fontSize: 10.5, color: TOK.inkMute, fontFamily: MONO }}>{tag}</div>}
    </div>
  );
}
function Lede({ children }) {
  return <div style={{ fontSize: 11.5, color: TOK.inkMute, marginBottom: 14, lineHeight: 1.55 }}>{children}</div>;
}

// Amortisation, shown through Caicedo's actual arc: the book grinds down on
// schedule while the market's opinion swings around it.
function AmortisationExplainer() {
  const fee = 115, years = 8;
  const annual = fee / years;
  const w = 640, h = 180, padL = 40, padR = 14, padT = 14, padB = 26;
  const toX = (yr) => padL + (yr / years) * (w - padL - padR);
  const toY = (v) => padT + (h - padT - padB) * (1 - v / fee);
  const p1 = { yr: 0.75, book: fee - annual * 0.75, mkt: 73 };   // May 2024
  const p2 = { yr: 3.0, book: fee - annual * 3.0, mkt: 90 };     // Aug 2026
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        {[0, 40, 80, 115].map((t) => (
          <g key={t}>
            <line x1={padL} x2={w - padR} y1={toY(t)} y2={toY(t)} stroke={TOK.border} strokeWidth="1" />
            <text x={padL - 8} y={toY(t) + 3} fontSize="9.5" fill={TOK.inkMute} textAnchor="end" fontFamily={MONO}>{t}</text>
          </g>
        ))}
        {[0, 2, 4, 6, 8].map((yr) => (
          <text key={yr} x={toX(yr)} y={h - 8} fontSize="9.5" fill={TOK.inkMute} textAnchor="middle" fontFamily={MONO}>yr {yr}</text>
        ))}
        <line x1={toX(0)} y1={toY(fee)} x2={toX(years)} y2={toY(0)} stroke={TOK.blue} strokeWidth="2.2" strokeLinecap="round" />
        <text x={toX(4.6)} y={toY(fee - annual * 4.6) - 8} fontSize="10" fill={TOK.blue} fontFamily={MONO}>book value: -€{annual.toFixed(1)}M/yr, every yr, no matter what</text>
        <line x1={toX(p1.yr)} y1={toY(p1.book)} x2={toX(p1.yr)} y2={toY(p1.mkt)} stroke={TOK.fall} strokeWidth="2" strokeDasharray="3 3" />
        <circle cx={toX(p1.yr)} cy={toY(p1.mkt)} r="4" fill={TOK.fall} />
        <text x={toX(p1.yr) + 8} y={toY(p1.mkt) + 13} fontSize="9.5" fill={TOK.fall} fontFamily={MONO}>May '24: mkt €73M, €31M BELOW book</text>
        <line x1={toX(p2.yr)} y1={toY(p2.book)} x2={toX(p2.yr)} y2={toY(p2.mkt)} stroke={TOK.rise} strokeWidth="2" strokeDasharray="3 3" />
        <circle cx={toX(p2.yr)} cy={toY(p2.mkt)} r="4" fill={TOK.rise} />
        <text x={toX(p2.yr) + 8} y={toY(p2.mkt) - 6} fontSize="9.5" fill={TOK.rise} fontFamily={MONO}>Aug '26: mkt €90M, €18M ABOVE book</text>
      </svg>
      <div style={{ fontSize: 11.5, color: TOK.inkMute, lineHeight: 1.55, marginTop: 8 }}>
        A worked example using Moisés Caicedo's real figures. Chelsea capitalised his €115M fee and writes off
        €{annual.toFixed(1)}M a year across his 8-year deal (blue line). The market's opinion moves independently:
        in May 2024 he was valued €31M below his carrying value: a paper loss and, had it persisted, an impairment
        candidate. Two years on, the book had mechanically ground down to €72M while his form recovered the market
        to €90M. The same player flipped from liability risk to €18M of unbooked gain without Chelsea doing
        anything but waiting. Amortisation is a conveyor belt; market value is a mood. Every row in the ledger
        below is the distance between the two.
      </div>
    </div>
  );
}

function LedgerRow({ d, maxAbsGap }) {
  if (d.suspended) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderBottom: `1px solid ${TOK.border}`, background: "#1C1418" }}>
        <div style={{ width: 96, flexShrink: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: TOK.fall }}>{ticker(d.name)}</div>
          <div style={{ fontSize: 9.5, color: TOK.inkMute }}>{d.yrs} · suspended</div>
        </div>
        <div style={{ width: 60, textAlign: "right", fontFamily: MONO, fontSize: 11, color: TOK.inkSoft, flexShrink: 0 }}>{fmtEUR(d.fee)}</div>
        <div style={{ width: 60, textAlign: "right", fontFamily: MONO, fontSize: 11, color: TOK.fall, flexShrink: 0 }}>{fmtEUR(d.book)}</div>
        <div style={{ flex: 1, fontSize: 10, color: TOK.fall, fontFamily: MONO, textAlign: "center" }}>
          <AlertTriangle size={11} style={{ verticalAlign: "-2px", marginRight: 4 }} />NO LISTED VALUE: FULL WRITE-OFF RISK
        </div>
        <div style={{ width: 60, textAlign: "right", fontFamily: MONO, fontSize: 11, color: TOK.inkMute, flexShrink: 0 }}>N/A</div>
        <div style={{ width: 66, textAlign: "right", fontFamily: MONO, fontSize: 11, color: TOK.inkMute, flexShrink: 0 }}>n/a</div>
      </div>
    );
  }
  const gainer = d.gap >= 0;
  const color = gainer ? TOK.rise : TOK.fall;
  const barPct = Math.min(100, (Math.abs(d.gap) / maxAbsGap) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderBottom: `1px solid ${TOK.border}` }}>
      <div style={{ width: 96, flexShrink: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: d.academy ? TOK.amber : TOK.ink }}>{ticker(d.name)}</div>
        <div style={{ fontSize: 9.5, color: TOK.inkMute }}>{d.academy ? "zero cost basis" : d.yrs}{d.est ? " · mkt est." : ""}</div>
      </div>
      <div style={{ width: 60, textAlign: "right", fontFamily: MONO, fontSize: 11, color: TOK.inkSoft, flexShrink: 0 }}>{fmtEUR(d.fee)}</div>
      <div style={{ width: 60, textAlign: "right", fontFamily: MONO, fontSize: 11, color: TOK.inkSoft, flexShrink: 0 }}>{fmtEUR(d.book)}</div>
      <div style={{ flex: 1, minWidth: 60, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: 6, background: TOK.panel2, borderRadius: 3, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: gainer ? "50%" : `${50 - barPct / 2}%`, width: `${barPct / 2}%`, height: "100%", background: color, borderRadius: 3 }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: TOK.borderStrong }} />
        </div>
      </div>
      <div style={{ width: 60, textAlign: "right", fontFamily: MONO, fontSize: 11, color: TOK.ink, flexShrink: 0 }}>{fmtEUR(d.mkt)}</div>
      <div style={{ width: 66, textAlign: "right", flexShrink: 0 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color }}>{gainer ? "+" : "-"}{fmtEUR(Math.abs(d.gap))}</span>
      </div>
    </div>
  );
}

function ExitRow({ e, maxAbsPl }) {
  const gainer = e.pl >= 0;
  const color = gainer ? TOK.rise : TOK.fall;
  const barPct = Math.min(100, (Math.abs(e.pl) / maxAbsPl) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderBottom: `1px solid ${TOK.border}` }}>
      <div style={{ width: 118, flexShrink: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: e.academy ? TOK.amber : TOK.ink }}>{ticker(e.name)}</div>
        <div style={{ fontSize: 9.5, color: TOK.inkMute }}>→ {e.to} · {e.year}</div>
      </div>
      <div style={{ width: 62, textAlign: "right", fontFamily: MONO, fontSize: 11, color: TOK.inkSoft, flexShrink: 0 }}>{fmtEUR(e.bookAtSale)}</div>
      <div style={{ width: 62, textAlign: "right", fontFamily: MONO, fontSize: 11, color: TOK.ink, flexShrink: 0 }}>{fmtEUR(e.price)}</div>
      <div style={{ flex: 1, minWidth: 50, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: 6, background: TOK.panel2, borderRadius: 3, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: gainer ? "50%" : `${50 - barPct / 2}%`, width: `${barPct / 2}%`, height: "100%", background: color, borderRadius: 3 }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: TOK.borderStrong }} />
        </div>
      </div>
      <div style={{ width: 70, textAlign: "right", flexShrink: 0 }}>
        <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color }}>{gainer ? "+" : "-"}{fmtEUR(Math.abs(e.pl))}</span>
      </div>
    </div>
  );
}

function FeeAnatomy() {
  const value = 30, goodwill = 70, total = value + goodwill;
  return (
    <div>
      <div style={{ display: "flex", height: 34, borderRadius: 6, overflow: "hidden", border: `1px solid ${TOK.border}` }}>
        <div style={{ width: `${(value / total) * 100}%`, background: "#153057", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: "#7FB3F5", fontWeight: 600 }}>€{value}M modelled value</span>
        </div>
        <div style={{ width: `${(goodwill / total) * 100}%`, background: "#3D2412", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: TOK.orange, fontWeight: 600 }}>€{goodwill}M goodwill</span>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: TOK.inkMute, lineHeight: 1.55, marginTop: 10 }}>
        Exhibit: Mudryk, January 2023. A fee of roughly €100M against an independent model estimate near €30M at
        signing. Market inflation is systematic: it lifts every fee and explains the ~7x rise in the average since
        2000/01. Goodwill is idiosyncratic: the premium a single buyer pays above modelled value for what no model
        prices: beating a rival to a signature, positional urgency, contract option value. The same decomposition
        applies on today's book: Rogers was signed at €135M against a €110M listed value, meaning Chelsea booked
        roughly €25M of day-one goodwill on its own record signing. Inflation sets the tide; goodwill is the
        decision.
      </div>
    </div>
  );
}

function InflationConverter() {
  const [seasonIdx, setSeasonIdx] = useState(4);
  const [amount, setAmount] = useState(10);
  const sel = INFLATION_INDEX[seasonIdx];
  const factor = CURRENT_INDEX / sel.idx;
  return (
    <div style={{ background: TOK.panel2, border: `1px solid ${TOK.border}`, borderRadius: 8, padding: "14px 16px", marginTop: 14 }}>
      <div style={{ fontSize: 10.5, color: TOK.inkMute, fontFamily: MONO, marginBottom: 10 }}>FEE CONVERTER: RESTATE ANY HISTORIC FEE IN 25/26 MONEY</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: TOK.inkSoft }}>€</span>
          <input type="number" min="1" max="500" value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 70, padding: "7px 9px", borderRadius: 6, border: `1px solid ${TOK.border}`, background: TOK.bg, color: TOK.ink, fontFamily: MONO, fontSize: 13, outline: "none" }} />
          <span style={{ fontSize: 12, color: TOK.inkSoft }}>M in</span>
        </div>
        <select value={seasonIdx} onChange={(e) => setSeasonIdx(Number(e.target.value))}
          style={{ padding: "7px 9px", borderRadius: 6, border: `1px solid ${TOK.border}`, background: TOK.bg, color: TOK.ink, fontFamily: MONO, fontSize: 13, outline: "none" }}>
          {INFLATION_INDEX.slice(0, 17).map((d, i) => <option key={d.season} value={i}>{d.season}</option>)}
        </select>
        <ArrowRight size={15} color={TOK.blue} />
        <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: TOK.blue }}>≈ {fmtEUR(amount * factor)}</div>
        <div style={{ fontSize: 11, color: TOK.inkMute }}>({factor.toFixed(1)}x)</div>
      </div>
    </div>
  );
}

function RecordChain() {
  const max = Math.max(...BRITISH_RECORD_CHAIN.map((r) => r.fee));
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: TOK.inkMute, marginBottom: 10, fontFamily: MONO, letterSpacing: 0.3 }}>
        MOST EXPENSIVE BRITISH-ELIGIBLE PLAYER OVER TIME
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 90 }}>
        {BRITISH_RECORD_CHAIN.map((r, i) => (
          <div key={r.name} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
            <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: TOK.ink, marginBottom: 4 }}>€{r.fee}M</div>
            <div style={{ width: "100%", maxWidth: 74, borderRadius: "4px 4px 0 0", background: i === BRITISH_RECORD_CHAIN.length - 1 ? TOK.orange : TOK.blue, opacity: i === BRITISH_RECORD_CHAIN.length - 1 ? 1 : 0.5 + i * 0.2, height: `${(r.fee / max) * 58}px` }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
        {BRITISH_RECORD_CHAIN.map((r) => (
          <div key={r.name} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: TOK.ink }}>{r.name}</div>
            <div style={{ fontSize: 9.5, color: TOK.inkMute, fontFamily: MONO }}>{r.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InflationChart() {
  const w = 640, h = 150, padL = 34, padR = 10, padT = 10, padB = 22;
  const max = Math.max(...INFLATION_INDEX.map((d) => d.idx));
  const pts = INFLATION_INDEX.map((d, i) => ({
    x: padL + (i * (w - padL - padR)) / (INFLATION_INDEX.length - 1),
    y: padT + (h - padT - padB) * (1 - d.idx / max), ...d,
  }));
  const splitAt = pts.findIndex((p) => !p.real);
  const line = (arr) => arr.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${padL},${h - padB} ${line(pts)} ${pts[pts.length - 1].x},${h - padB}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {[100, 300, 500, 700].map((t) => {
        const y = padT + (h - padT - padB) * (1 - t / max);
        return (
          <g key={t}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke={TOK.border} strokeWidth="1" />
            <text x={padL - 8} y={y + 3} fontSize="9.5" fill={TOK.inkMute} textAnchor="end" fontFamily={MONO}>{t}</text>
          </g>
        );
      })}
      <polygon points={area} fill={TOK.blue} opacity="0.08" />
      <polyline points={line(pts.slice(0, splitAt + 1))} fill="none" stroke={TOK.blue} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={line(pts.slice(splitAt))} fill="none" stroke={TOK.blue} strokeWidth="2.2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
      {pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1).map((p) => (
        <text key={p.season} x={p.x} y={h - 4} fontSize="9.5" fill={TOK.inkMute} textAnchor="middle" fontFamily={MONO}>{p.season}</text>
      ))}
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.2" fill={TOK.blue} />
    </svg>
  );
}

function CaseStudyChip({ c }) {
  return (
    <div style={{ background: TOK.panel2, border: `1px solid ${TOK.border}`, borderRadius: 8, padding: "12px 14px", minWidth: 168, flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: TOK.ink, fontFamily: HEAD }}>{c.name}</div>
      <div style={{ fontSize: 11, color: TOK.inkMute, marginBottom: 8 }}>{c.year} {c.club}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: MONO }}>
        <span style={{ fontSize: 12.5, color: TOK.inkMute, textDecoration: "line-through" }}>£{c.nominal}M</span>
        <ArrowRight size={11} color={TOK.blue} />
        <span style={{ fontSize: 14.5, fontWeight: 600, color: TOK.blue }}>£{c.adjusted}M</span>
      </div>
      <div style={{ fontSize: 10, color: TOK.inkMute, marginTop: 3 }}>fee, restated in today's market</div>
    </div>
  );
}

function PlayerRow({ p, onSelect, showReal }) {
  const tier = tierOf(p);
  const real = p.value / DEFLATOR;
  return (
    <button onClick={() => onSelect(p)}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: TOK.panel, border: `1px solid ${TOK.border}`, borderRadius: 8, cursor: "pointer", textAlign: "left" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = TOK.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = TOK.border)}>
      <div style={{ width: 44, flexShrink: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: TOK.inkSoft, letterSpacing: 0.3 }}>{ticker(p.name)}</div>
        <div style={{ fontFamily: MONO, fontSize: 9.5, color: TOK.inkMute, marginTop: 1 }}>{p.pos}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 14.5, color: TOK.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
        <div style={{ fontSize: 11.5, color: TOK.inkMute, marginTop: 1 }}>{p.club} · age {p.age}</div>
      </div>
      <Sparkline trend={p.trend} color={p.chg >= 0 ? TOK.rise : TOK.fall} />
      <div style={{ width: 104, textAlign: "right" }}>
        <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: TOK.ink }}>{fmtEUR(p.value)}</div>
        {showReal ? (
          <div style={{ fontSize: 10.5, color: TOK.blue, fontFamily: MONO }}>≈{fmtEUR(real)} '01</div>
        ) : (<ChangeTag chg={p.chg} />)}
      </div>
      <div style={{ width: 108, display: "flex", justifyContent: "flex-end" }}><Badge tier={tier} /></div>
    </button>
  );
}

function DetailPanel({ p, all, onClose, showReal }) {
  const tier = tierOf(p);
  const mult = (p.value / p.perf) * 10;
  const real = p.value / DEFLATOR;
  const compSet = comps(p, all);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: TOK.panel, border: `1px solid ${TOK.border}`, borderRadius: 12, maxWidth: 560, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
        <div style={{ background: TOK.panel2, borderBottom: `1px solid ${TOK.border}`, padding: "24px 26px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "transparent", border: "none", color: TOK.inkMute, cursor: "pointer" }}><X size={20} /></button>
          <div style={{ fontSize: 11.5, color: TOK.inkMute, marginBottom: 6, fontFamily: MONO }}>{ticker(p.name)} · {p.club} · {p.pos} · AGE {p.age}</div>
          <div style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 26, color: TOK.ink }}>{p.name}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
            <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: TOK.ink }}>{fmtEUR(p.value)}</div>
            <ChangeTag chg={p.chg} />
          </div>
          {showReal && (
            <div style={{ fontSize: 12, color: TOK.inkSoft, marginTop: 4 }}>
              ≈ <b style={{ color: TOK.ink }}>{fmtEUR(real)}</b> in 2001 terms. The market has inflated {DEFLATOR.toFixed(1)}x since then.
            </div>
          )}
          <div style={{ marginTop: 10 }}><Badge tier={tier} /></div>
        </div>
        <div style={{ padding: "20px 26px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ border: `1px solid ${TOK.border}`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, color: TOK.inkMute, marginBottom: 4, fontFamily: MONO }}>PERFORMANCE INDEX</div>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: TOK.ink }}>{p.perf}/100</div>
            </div>
            <div style={{ border: `1px solid ${TOK.border}`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, color: TOK.inkMute, marginBottom: 4, fontFamily: MONO }}>VALUE MULTIPLE</div>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: TOK.ink }}>{mult.toFixed(1)}x</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: TOK.inkMute, marginBottom: 8, fontFamily: MONO }}>COMPARABLE SET</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {compSet.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: TOK.panel2, borderRadius: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: TOK.ink }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: TOK.inkMute }}>{c.club}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: TOK.ink }}>{fmtEUR(c.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransferValueDesk() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [showMethod, setShowMethod] = useState(false);
  const [showReal, setShowReal] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? PLAYERS.filter((p) => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || p.pos.toLowerCase() === q)
      : [...PLAYERS].sort((a, b) => b.value - a.value).slice(0, 8);
  }, [query]);

  const active = HOLDINGS.filter((d) => !d.suspended);
  const ledgerSorted = [...active].sort((a, b) => b.gap - a.gap);
  const maxAbsGap = Math.max(...active.map((d) => Math.abs(d.gap)));
  const totFee = HOLDINGS.reduce((s, d) => s + d.fee, 0);
  const totBook = HOLDINGS.reduce((s, d) => s + d.book, 0);
  const totMkt = active.reduce((s, d) => s + d.mkt, 0);
  const netPos = totMkt - active.reduce((s, d) => s + d.book, 0);
  const exitsSorted = [...EXITS].sort((a, b) => b.pl - a.pl);
  const maxAbsPl = Math.max(...EXITS.map((e) => Math.abs(e.pl)));
  const totRealized = EXITS.reduce((s, e) => s + e.pl, 0);
  const totAcademy = ACADEMY_SALES.reduce((s, d) => s + d.fee, 0);
  const mudryk = HOLDINGS.find((d) => d.suspended);

  const StatChip = ({ label, value, color }) => (
    <div style={{ background: TOK.panel2, borderRadius: 6, padding: "10px 12px", border: `1px solid ${TOK.border}`, flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 9.5, color: TOK.inkMute, fontFamily: MONO }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: color || TOK.ink }}>{value}</div>
    </div>
  );

  return (
    <div style={{ background: TOK.bg, minHeight: "100%", fontFamily: BODY, color: TOK.ink, padding: "0 0 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #616D7D; }
        ::selection { background: #1E3A5F; color: #E8ECF1; }
        .scrollx { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .scrollx::-webkit-scrollbar { height: 6px; }
        .scrollx::-webkit-scrollbar-thumb { background: #333A45; border-radius: 3px; }
        .scrollx > div { min-width: 520px; }
        .autogrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; }
      `}</style>

      <div style={{ background: TOK.panel, borderBottom: `1px solid ${TOK.border}`, padding: "40px 24px 36px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ fontSize: 11.5, letterSpacing: 0.6, color: TOK.blue, marginBottom: 10, fontFamily: MONO }}>CFC:VALUE · EQUITY-STYLE COVERAGE · AUG 2026</div>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 32, lineHeight: 1.15, marginBottom: 12, maxWidth: 640, color: TOK.ink }}>
            Chelsea FC: an asset manager that plays football on weekends
          </div>
          <div style={{ fontSize: 14, color: TOK.inkSoft, maxWidth: 640, lineHeight: 1.55, marginBottom: 18 }}>
            Thesis: under Boehly-Clearlake, Chelsea operates less like a football club and more like a private
            equity fund: buy young, contract long, amortise slowly, wage cheap, and sell whatever the accounts
            reward selling. This desk marks the whole strategy to market: every current holding at fee, book and
            market value; realized P&L on every position closed since 2024; the academy's zero-cost-basis pipeline;
            and the inflated, goodwill-laden market it all trades in.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
            <StatChip label="SQUAD MARKET VALUE (TM)" value="€1.33B" />
            <StatChip label="UNBOOKED GAIN, HOLDINGS" value={`+${fmtEUR(netPos)}`} color={TOK.rise} />
            <StatChip label="REALIZED P&L, '24-'26 EXITS" value={`+${fmtEUR(totRealized)} est`} color={TOK.rise} />
            <StatChip label="ACADEMY SALES, 3 SEASONS" value="£251M+" color={TOK.amber} />
          </div>

          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: TOK.inkMute }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="search ticker, club, or position (FW / MF / DF / GK)"
              style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: 8, border: `1px solid ${TOK.border}`, fontSize: 13.5, background: TOK.bg, color: TOK.ink, outline: "none", fontFamily: MONO }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "26px 24px 0" }}>

        <SectionCard>
          <SectionHeader num="01" title="Accounting primer: how a fee becomes a book value" tag="AMORTISATION" />
          <Lede>
            A transfer fee never hits the accounts in one hit. It is capitalised as an intangible asset and written
            down in equal annual slices across the contract, so the number that matters for spending rules is the
            annual charge, not the headline fee. That single mechanic explains most of what Chelsea has done since
            2022, and it is why the club pioneered 8-to-10-year contracts before regulators capped amortisation at
            five years.
          </Lede>
          <AmortisationExplainer />
        </SectionCard>

        <SectionCard>
          <SectionHeader num="02" title="Current holdings: the book, marked to market" tag="17 POSITIONS · AUG 2026" />
          <Lede>
            Every purchased or academy first-team player currently owned, at three marks: fee (cost), book (carrying
            value after amortisation), and market (Transfermarkt-listed where available, estimated where flagged).
            The bar is the spread between book and market. Green rows are worth more than the accounts say, and red
            rows are worth less. Sorted by that spread. Departed players are excluded and appear in the realized P&L section
            below.
          </Lede>
          <div className="scrollx"><div>
          <div style={{ display: "flex", gap: 10, padding: "0 10px 6px", fontSize: 9.5, color: TOK.inkMute, fontFamily: MONO }}>
            <div style={{ width: 96 }}>POSITION</div>
            <div style={{ width: 60, textAlign: "right" }}>FEE</div>
            <div style={{ width: 60, textAlign: "right" }}>BOOK</div>
            <div style={{ flex: 1 }} />
            <div style={{ width: 60, textAlign: "right" }}>MARKET</div>
            <div style={{ width: 66, textAlign: "right" }}>SPREAD</div>
          </div>
          <div style={{ border: `1px solid ${TOK.border}`, borderRadius: 8, overflow: "hidden" }}>
            {ledgerSorted.map((d) => <LedgerRow key={d.name} d={d} maxAbsGap={maxAbsGap} />)}
            {mudryk && <LedgerRow d={mudryk} maxAbsGap={maxAbsGap} />}
          </div>
          </div></div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <StatChip label="TOTAL COST" value={fmtEUR(totFee)} />
            <StatChip label="CARRYING VALUE" value={fmtEUR(totBook)} />
            <StatChip label="MARKET VALUE" value={fmtEUR(totMkt)} />
            <StatChip label="NET UNBOOKED GAIN" value={`+${fmtEUR(netPos)}`} color={TOK.rise} />
          </div>
          <div style={{ fontSize: 11, color: TOK.inkMute, marginTop: 14, lineHeight: 1.55 }}>
            Three reads. First, the book sits comfortably below the market, with roughly {fmtEUR(netPos)} of gain
            the accounts haven't recognised, concentrated in Palmer, Estêvão and the zero-cost academy pair. Second,
            the red rows are shallow: after the 2025-26 clear-out, the deep impairment cases have mostly been sold,
            leaving Fofana and Lavia as modest paper losses and Rogers carrying ~€24M of day-one goodwill his
            performance now has to justify. Third, Mudryk: suspended, no listed market value, €41.5M still on the
            books, the single largest write-off risk at the club.
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader num="03" title="Realized P&L: every position closed, 2024-26" tag="BOOK@SALE · PRICE · P&L" />
          <Lede>
            Selling is where accounting strategy becomes cash. A sale books profit equal to price minus remaining
            carrying value, so slow amortisation and zero-cost academy assets both widen the profit on exit. Eleven
            first-team positions were closed between 2024 and this window. Ten closed green.
          </Lede>
          <div className="scrollx"><div>
          <div style={{ display: "flex", gap: 10, padding: "0 10px 6px", fontSize: 9.5, color: TOK.inkMute, fontFamily: MONO }}>
            <div style={{ width: 118 }}>POSITION</div>
            <div style={{ width: 62, textAlign: "right" }}>BOOK@SALE</div>
            <div style={{ width: 62, textAlign: "right" }}>PRICE</div>
            <div style={{ flex: 1 }} />
            <div style={{ width: 70, textAlign: "right" }}>P&L</div>
          </div>
          <div style={{ border: `1px solid ${TOK.border}`, borderRadius: 8, overflow: "hidden" }}>
            {exitsSorted.map((e) => <ExitRow key={e.name} e={e} maxAbsPl={maxAbsPl} />)}
          </div>
          </div></div>
          <div style={{ fontSize: 11, color: TOK.inkMute, marginTop: 14, lineHeight: 1.55 }}>
            Estimated realized accounting profit across the eleven: <b style={{ color: TOK.rise }}>+{fmtEUR(totRealized)}</b>.
            The distribution is the story. The two biggest winners cost almost nothing (Santos bought for ~€15M,
            Gallagher grown for free). Cucurella closes the loop on section 01: carried €31M above market in 2024,
            held rather than impaired, form recovered, sold to Real Madrid at €36M over book. Delap was flipped for
            +€34M in twelve months. The single red row, Nkunku, is what crystallising a loss looks like: sold below
            carrying value, the paper loss finally made real. One realized loss out of eleven exits is not luck.
            It is what long contracts, low wages and patience are engineered to produce.
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader num="04" title="Capital recycling: the Cobham pipeline" tag="ZERO COST BASIS" />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
            <GraduationCap size={16} color={TOK.amber} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11.5, color: TOK.inkMute, lineHeight: 1.55 }}>
              An academy graduate carries no fee, so his book value is zero and every euro of a sale is recognised
              profit. Under PSR that makes homegrown players the highest-margin inventory in football, and Chelsea
              runs the most profitable academy in England on exactly that logic: over £251M banked from academy
              sales in three seasons, funding the buy side of the machine.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {ACADEMY_SALES.map((s) => (
              <div key={s.name + s.year} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: TOK.panel2, borderRadius: 6, border: `1px solid ${TOK.border}` }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 12.5, color: TOK.ink }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: TOK.inkMute, marginLeft: 8 }}>→ {s.to} · {s.year}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: TOK.rise }}>{fmtEUR(s.fee)}</span>
                  <span style={{ fontSize: 9.5, fontFamily: MONO, color: TOK.amber, background: "#2A2210", padding: "2px 7px", borderRadius: 3 }}>100% PROFIT</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: TOK.inkMute, marginTop: 12, lineHeight: 1.55 }}>
            The incentive cuts against sentiment: PSR structurally rewards selling the players supporters most want
            kept. Gallagher joined at eight; Chalobah and George left this summer on the same pure-profit logic.
            And when player sales weren't enough, Chelsea sold two hotels and its women's team to a parent company
            for a combined £276.6M. On the current book, James and Colwill are the remaining zero-cost assets:
            €103M of market value carried at exactly €0.
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader num="05" title="Cost structure: the wage side of the trade" tag="LOW BASE · HIGH BONUS" />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
            <Wallet size={16} color={TOK.blue} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11.5, color: TOK.inkMute, lineHeight: 1.55 }}>
              The fee strategy is only viable because of the wage structure underneath it: reported low base
              salaries with heavy bonuses tied to league finish, European qualification and silverware, and pay
              rises pre-written into contracts as performance triggers rather than renegotiations.
            </div>
          </div>
          <div className="autogrid" style={{ marginBottom: 12 }}>
            <div style={{ background: TOK.panel2, borderRadius: 6, padding: "10px 12px", border: `1px solid ${TOK.border}` }}>
              <div style={{ fontSize: 9.5, color: TOK.inkMute, fontFamily: MONO }}>FIXED → VARIABLE</div>
              <div style={{ fontSize: 11, color: TOK.inkSoft, marginTop: 4, lineHeight: 1.45 }}>Bonuses land in the years success lifts revenue, so payroll flexes with income</div>
            </div>
            <div style={{ background: TOK.panel2, borderRadius: 6, padding: "10px 12px", border: `1px solid ${TOK.border}` }}>
              <div style={{ fontSize: 9.5, color: TOK.inkMute, fontFamily: MONO }}>RESALE LIQUIDITY</div>
              <div style={{ fontSize: 11, color: TOK.inkSoft, marginTop: 4, lineHeight: 1.45 }}>Modest wages keep the buyer pool wide; ten of eleven exits in section 03 found buyers at green prices</div>
            </div>
            <div style={{ background: TOK.panel2, borderRadius: 6, padding: "10px 12px", border: `1px solid ${TOK.border}` }}>
              <div style={{ fontSize: 9.5, color: TOK.inkMute, fontFamily: MONO }}>COST BASE RESET</div>
              <div style={{ fontSize: 11, color: TOK.inkSoft, marginTop: 4, lineHeight: 1.45 }}>Wage bill reportedly cut from ~£330M at takeover toward ~£170M (Capology estimates)</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: TOK.inkMute, lineHeight: 1.55 }}>
            Clearlake is a private equity firm, and this is portfolio-company management applied to a squad: control
            the fixed cost base (a co-founder publicly targeted cutting salary and opex by over $100M a year), keep
            every asset saleable, let incentives do the motivating. The control case proving the point is Raheem
            Sterling, whose legacy £325k-a-week contract from the old regime made him effectively unsellable for
            two years. The counter-argument is also real: bonus-heavy terms price out established stars, and a squad
            built to be sellable is not automatically a squad built to win.
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader num="06" title="Market environment: inflation sets the tide, goodwill is the decision" tag="WHY €100M ISN'T €100M" />
          <Lede>
            Two forces produce a modern mega-fee and they should never be conflated. Inflation is systematic: the
            average Premier League fee has risen roughly 7x since 2000/01 on our computed index. Goodwill is
            idiosyncratic: the premium one buyer pays over modelled value on one deal. Chelsea's book contains
            textbook examples of both.
          </Lede>
          <FeeAnatomy />
          <InflationConverter />
          <div style={{ marginTop: 16 }}>
            <InflationChart />
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              {CASE_STUDIES.map((c) => <CaseStudyChip key={c.name} c={c} />)}
            </div>
            <div style={{ fontSize: 11, color: TOK.inkMute, marginTop: 12, lineHeight: 1.5 }}>
              Restated in real terms, only one of the ten largest fees in Premier League history has been paid in
              the past decade. Inflation makes ordinary fees look historic; deflating them shows which bets
              genuinely were. Index is computed from actual transfer records to 2022/23 and extrapolated (dashed)
              from published aggregate spend thereafter, including the real 2024/25 contraction before the record
              2025/26 window.
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <RecordChain />
          <div style={{ fontSize: 11, color: TOK.inkMute, marginTop: 14, lineHeight: 1.5 }}>
            The British-eligible record changed hands twice in 19 days this summer, first Anderson to City and then Rogers
            to Chelsea, while the outright Premier League record (Isak, 2025) still stands. Homegrown-quota rules
            make an English passport a priced asset: Chelsea paid the scarcity premium knowingly, and it sits on the
            book as part of Rogers' €24M day-one goodwill.
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader num="07" title="Risk factors" tag="WHAT BREAKS THE THESIS" />
          <div className="autogrid">
            {[
              ["WRITE-OFF CONCENTRATION", "Mudryk's €41.5M carrying value has no listed market against it; a full impairment would be the era's largest single accounting loss."],
              ["KEY-ASSET DEPENDENCE", "Palmer, Estêvão and the academy pair account for the majority of the unbooked gain; the thesis is far thinner without them."],
              ["REGULATORY DRIFT", "The 5-year amortisation cap already closed the signature loophole prospectively; squad-cost-ratio rules tighten the wage-and-amortisation budget further."],
              ["MODEL RISK", "Book values here rest on reported contract terms and a flat FX rate; market values are third-party estimates, flagged where approximated. Directional, not audited."],
            ].map(([t, d]) => (
              <div key={t} style={{ background: TOK.panel2, borderRadius: 6, padding: "10px 12px", border: `1px solid ${TOK.border}` }}>
                <div style={{ fontSize: 9.5, color: TOK.fall, fontFamily: MONO, marginBottom: 4 }}>{t}</div>
                <div style={{ fontSize: 11, color: TOK.inkSoft, lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: TOK.inkMute, fontFamily: MONO, letterSpacing: 0.3 }}>
            {query ? `${filtered.length} RESULT${filtered.length === 1 ? "" : "S"}` : "THE BOARD: TOP BY VALUE"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TOK.inkMute, cursor: "pointer" }}>
              <input type="checkbox" checked={showReal} onChange={(e) => setShowReal(e.target.checked)} />
              2001-real terms
            </label>
            <button onClick={() => setShowMethod((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", color: TOK.inkMute, fontSize: 12, cursor: "pointer" }}>
              <Info size={13} /> Methodology
            </button>
          </div>
        </div>

        {showMethod && (
          <div style={{ background: TOK.panel, border: `1px solid ${TOK.border}`, borderRadius: 8, padding: "16px 18px", marginBottom: 18, fontSize: 12.5, lineHeight: 1.6, color: TOK.inkSoft }}>
            <b style={{ color: TOK.ink }}>Holdings and exits:</b> squad composition reflects the club as of the
            summer 2026 window (departures: Cucurella to Real Madrid, Jackson to Bayern, Santos to Man United, Delap
            to Forest, Chalobah to Como, George to Everton, plus the 2025 clear-out of Madueke, Nkunku, Petrović,
            Ugochukwu, Chukwuemeka and others; Badiashile, Disasi and Garnacho are out on loan and excluded).
            Fees per Transfermarkt; current market values from the Transfermarkt-based 2026/27 squad table where
            listed and estimated (flagged "est.") where not. GBP figures converted at a flat 1.15.
            <br /><br />
            <b style={{ color: TOK.ink }}>Book values:</b> straight-line amortisation from signing to Aug 2026.
            Deals signed after the Premier League's December 2023 rule amortise over a maximum of five years
            regardless of contract length; earlier deals (Enzo Fernández and Mudryk at 8.5 years, Caicedo at 8,
            Palmer at 10, the "Chelsea loophole" cohort) are grandfathered on full terms, all marked *. Assumed
            7-year terms elsewhere reflect Chelsea's reported standard. Contract extensions since signing (Enzo and
            Caicedo now run to 2032-33) would in practice re-spread remaining book value over the new term, a
            refinement noted here but not modelled. Book-at-sale for exits uses the same basis; realized P&L figures are
            estimates on that basis, not the club's audited numbers.
            <br /><br />
            <b style={{ color: TOK.ink }}>Inflation index:</b> 1992/93-2022/23 computed from a public
            transfer-records dataset (fee-paying PL transfers, mean fee per season, 2000/01 = 100); 2023/24-2025/26
            extrapolated from Deloitte's published summer spend (dashed). Goodwill exhibits use FootballTransfers
            xTV and Football Benchmark estimates as reported at the time. Wage-structure figures are reported
            estimates (Capology via fan-finance coverage; Clearlake's opex target stated publicly by its
            co-founder); wage data is not officially disclosed.
            <br /><br />
            <i>Board sparklines and the Performance Index are illustrative; all figures in sections 01-07 are
            sourced or computed as described.</i>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: TOK.inkMute, fontSize: 13 }}>
              no players match "{query}". Try a name, club, or position.
            </div>
          ) : (
            filtered.map((p) => <PlayerRow key={p.id} p={p} onSelect={setSelected} showReal={showReal} />)
          )}
        </div>

        <div style={{ background: TOK.panel, border: `1px solid ${TOK.borderStrong}`, borderRadius: 10, padding: "20px 22px", marginTop: 28 }}>
          <div style={{ fontSize: 10.5, color: TOK.blue, fontFamily: MONO, letterSpacing: 0.5, marginBottom: 8 }}>ABOUT THIS PROJECT</div>
          <div style={{ fontSize: 12.5, color: TOK.inkSoft, lineHeight: 1.65 }}>
            An independent analysis applying corporate-finance frameworks (amortisation and carrying value,
            impairment, realized P&L, goodwill, cost-structure analysis, and a computed price index) to the
            Premier League transfer market, with Chelsea FC as the case study. The inflation index is computed from
            30+ seasons of transfer records; valuations are drawn from Transfermarkt, CIES Football Observatory and
            FootballTransfers; accounting mechanics follow the same straight-line amortisation rules clubs use
            under the Premier League's Profit and Sustainability framework. Full methodology and every assumption
            are disclosed above.
          </div>
          <div style={{ borderTop: `1px solid ${TOK.border}`, marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12, color: TOK.ink, fontWeight: 600 }}>
              Built by Charles Watson <span style={{ color: TOK.inkMute, fontWeight: 400 }}>· finance × football analytics ·{" "}</span>
              <a href="https://www.linkedin.com/in/charles-watson-1858a4353/" target="_blank" rel="noopener noreferrer" style={{ color: TOK.blue, textDecoration: "none" }}>
                linkedin.com/in/charles-watson
              </a>
            </div>
            <div style={{ fontSize: 10.5, color: TOK.inkMute, fontFamily: MONO }}>DATA AS OF AUG 2026 · NOT AUDITED FIGURES</div>
          </div>
        </div>
      </div>

      {selected && <DetailPanel p={selected} all={PLAYERS} onClose={() => setSelected(null)} showReal={showReal} />}
    </div>
  );
}
