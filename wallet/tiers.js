/* Fidelity card tiers for Hamburgheria del Contadino.
 * Single source for the wallet passes, the card artwork and the docs.
 * Keep `min`/`mult` in step with TIERS in app.js. */
'use strict';

const TIERS = [
  {
    id: 'germoglio',
    name: 'Germoglio',
    meaning: 'The sprout',
    audience: 'New customers',
    min: 0, // lifetime spend in cents
    mult: 1,
    motto: 'Ogni raccolto comincia da un seme.',
    perks: ['1 punto per ogni euro', 'Patatine rustiche omaggio a 80 punti', 'Dolce di benvenuto alla seconda visita'],
    colors: {
      bgTop: '#21402f', bgBottom: '#0f2219', background: '#162d21',
      foreground: '#f1ecdd', label: '#a8c79a', accent: '#a8c79a', accentDeep: '#6f9362',
    },
  },
  {
    id: 'raccolto',
    name: 'Raccolto',
    meaning: 'The harvest',
    audience: 'Regular customers',
    min: 25000,
    mult: 1.25,
    motto: 'Il frutto di ogni visita.',
    perks: ['1,25 punti per ogni euro', 'Burger del mese in anteprima', 'Tavolo prenotabile anche il sabato sera'],
    colors: {
      bgTop: '#4d311c', bgBottom: '#241609', background: '#342113',
      foreground: '#f7ebd3', label: '#d8a547', accent: '#d8a547', accentDeep: '#9b7229',
    },
  },
  {
    id: 'riserva',
    name: 'Riserva',
    meaning: 'The reserve: the best of the harvest, set aside',
    audience: 'VIP customers',
    min: 60000,
    mult: 1.5,
    motto: 'Il meglio del raccolto, messo da parte per te.',
    perks: ['1,5 punti per ogni euro', 'Tavolo riservato, senza attesa', 'Degustazione privata del nuovo menu', 'Un calice della casa ad ogni visita'],
    colors: {
      bgTop: '#1c1a16', bgBottom: '#080807', background: '#0e0d0b',
      foreground: '#efe3c2', label: '#c2a45c', accent: '#d9bc72', accentDeep: '#8a6d2f',
      foil: ['#7a5c22', '#e8cf8a', '#b8923f', '#f5e3a8', '#8a6d2f'],
    },
  },
];

// Rewards bought with points (same as REWARDS in app.js).
const REWARDS = [
  { id: 'r-side', cost: 80, label: 'Patatine rustiche' },
  { id: 'r-dessert', cost: 120, label: 'Tiramisù della nonna' },
  { id: 'r-burger', cost: 200, label: 'Il Contadino' },
];

const tierById = Object.fromEntries(TIERS.map((t) => [t.id, t]));
const tierForSpend = (cents) => TIERS.reduce((t, x) => (cents >= x.min ? x : t), TIERS[0]);

const BRAND = {
  name: 'Hamburgheria del Contadino',
  program: 'Carta Fedeltà',
  fidelityUrl: 'https://lhamburgerdelcontadino.plateform.app/frontpage/fidelity',
};
const cardUrl = (cardId) => `${BRAND.fidelityUrl}?card=${encodeURIComponent(cardId)}`;

module.exports = { TIERS, REWARDS, tierById, tierForSpend, BRAND, cardUrl };
