# Graph Report - josh02  (2026-10-08)

## Corpus Check
- Corpus is ~32,705 words - fits in a single context window. You may not need a graph.

## Summary
- 208 nodes · 391 edges · 8 communities (6 shown, 2 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.86)
- Token cost: 91,440 input · 0 output

## Community Hubs (Navigation)
- Wallet Pass Builder
- Contadino Club PWA
- Till & CRM Engine
- QR & Icon Tooling
- Loyalty Tiers & Card Art
- App Surfaces & Docs
- Offline Service Worker

## God Nodes (most connected - your core abstractions)
1. `stats()` - 14 edges
2. `statsFor()` - 9 edges
3. `renderCrm()` - 8 edges
4. `cTop()` - 8 edges
5. `sTop()` - 8 edges
6. `applePassJson()` - 8 edges
7. `banner()` - 8 edges
8. `renderTill()` - 7 edges
9. `checkout()` - 7 edges
10. `renderCrmDetail()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Customer card view` --semantically_similar_to--> `Contadino Club customer side (Home, Novita, Messaggi, Carta, Profilo)`  [INFERRED] [semantically similar]
  index.html → mobile/index.html
- `CRM view (KPIs, customer table, profile)` --semantically_similar_to--> `Contadino Club staff side (Dashboard, Customers, Messages, Send)`  [INFERRED] [semantically similar]
  index.html → mobile/index.html
- `Contadino Club PWA (mobile/index.html)` --implements--> `Fidelity Loyalty Programme Rules`  [INFERRED]
  mobile/index.html → README.md
- `Contadino Club PWA (mobile/index.html)` --implements--> `localStorage sample data (deterministic demo)`  [INFERRED]
  mobile/index.html → README.md
- `README: Hamburgheria del Contadino Fidelity card & CRM` --references--> `Fidelity QR poster (A5 Carta Fedelta)`  [EXTRACTED]
  README.md → qr/fidelity-poster.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Wallet artwork motif rendering pipeline** — wallet_design_art_renderart, wallet_design_art_cardface, wallet_design_art_banner, wallet_design_art_crest, wallet_design_art_sprout, wallet_design_art_wheatear, wallet_design_art_guilloche, wallet_design_art_furrows [EXTRACTED 1.00]
- **Germoglio-Raccolto-Riserva tier ladder** — readme_tier_germoglio, readme_tier_raccolto, readme_tier_riserva, wallet_index_tiers [EXTRACTED 1.00]
- **Fidelity programme front-ends** — index, mobile_index, wallet_index, qr_fidelity_poster [INFERRED 0.85]

## Communities (8 total, 2 thin omitted)

### Community 0 - "Wallet Pass Builder"
Cohesion: 0.07
Nodes (43): Apple Wallet .pkpass, Google Wallet pass (Smart Tap), APPLE_IMAGES, applePassJson(), ART, b64url(), BUILD, buildApple() (+35 more)

### Community 1 - "Contadino Club PWA"
Cohesion: 0.13
Nodes (42): ago(), agoEn(), arrivals(), audienceLabel(), barChart(), bindTilt(), cCard(), cChat() (+34 more)

### Community 2 - "Till & CRM Engine"
Cohesion: 0.12
Nodes (37): allStats(), barChart(), buildTxn(), cardIdFrom(), cartTotals(), checkout(), copyText(), customersCsv() (+29 more)

### Community 3 - "QR & Icon Tooling"
Cohesion: 0.07
Nodes (23): Fidelity QR poster (A5 Carta Fedelta), Inline fidelity QR SVG (53x53 modules), Fidelity page URL (lhamburgerdelcontadino.plateform.app/frontpage/fidelity), { execFileSync }, fs, ICONS, OUT, path (+15 more)

### Community 4 - "Loyalty Tiers & Card Art"
Cohesion: 0.16
Nodes (18): Fidelity Loyalty Programme Rules, Rewards (fries 80pt, tiramisu 120pt, burger 200pt), Germoglio tier (the sprout), Raccolto tier (the harvest), Riserva tier (the reserve), banner(), cardFace(), crest() (+10 more)

### Community 5 - "App Surfaces & Docs"
Cohesion: 0.16
Nodes (18): Contadino Fidelity Card app (index.html), Camera QR scanner (jsQR), Customer card view, CRM view (KPIs, customer table, profile), Till view (scan / lookup / ticket), Contadino Club PWA (mobile/index.html), Contadino Club customer side (Home, Novita, Messaggi, Carta, Profilo), Contadino Club staff side (Dashboard, Customers, Messages, Send) (+10 more)

## Knowledge Gaps
- **33 isolated node(s):** `SHELL`, `fs`, `path`, `{ execFileSync }`, `{ tierById }` (+28 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 47 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `README: Hamburgheria del Contadino Fidelity card & CRM` connect `App Surfaces & Docs` to `QR & Icon Tooling`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `SHELL`, `fs`, `path` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Wallet Pass Builder` be split into smaller, more focused modules?**
  _Cohesion score 0.07030527289546716 - nodes in this community are weakly interconnected._
- **Why does `window.renderArt()` connect `Loyalty Tiers & Card Art` to `Wallet Pass Builder`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Should `Contadino Club PWA` be split into smaller, more focused modules?**
  _Cohesion score 0.12513842746400886 - nodes in this community are weakly interconnected._
- **Why does `Fidelity QR poster (A5 Carta Fedelta)` connect `QR & Icon Tooling` to `App Surfaces & Docs`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Should `Till & CRM Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.11605937921727395 - nodes in this community are weakly interconnected._