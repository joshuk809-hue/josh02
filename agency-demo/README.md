# Growth Suite: demo white-label

Demo cliccabile della suite di crescita AI da mostrare ai potenziali clienti. È un unico file, `index.html`: si apre in qualsiasi browser, senza installare nulla.

## Sezioni

| Sezione | Cosa mostra |
|---------|-------------|
| Panoramica | Numeri chiave, crescita del database clienti, "Da fare oggi" con azioni rapide, attività in tempo reale |
| Assistente AI | Chat WhatsApp / Instagram / sito che risponde alle FAQ e fissa prenotazioni |
| Clienti | CRM con ricerca, gruppi automatici (Nuovo, Abituale, VIP, A rischio), scheda cliente, note, copia CSV |
| Recensioni | Voto Google, richieste di recensione, risposte scritte dall'AI da approvare |
| Automazioni | 7 flussi (recensioni, chiamate perse, promemoria, recupero, benvenuto, compleanni, riordino): attiva, spegni o esegui |
| Magazzino | Entrate e uscite merce con operatore e note, anteprima della giacenza, avvisi sotto scorta, bozza d'ordine, registro movimenti |
| Personalizza | Nome e colore del cliente in un minuto, ripristino dei dati |

Quattro attività pronte, ognuna con il proprio stile grafico. Si cambiano dal selettore in basso a sinistra:

- **Ristorante**: trattoria, verde bottiglia e rosso pomodoro, tovaglia a quadri
- **Salone**: studio di bellezza, cipria e malva, luce morbida
- **Negozio**: bottega, carta kraft, blu e arancio cartellino
- **Agenzia social**: studio scuro, viola elettrico, griglia a puntini

L'interfaccia è in `rem` e la dimensione del testo cresce con lo schermo, quindi resta nitida e proporzionata da smartphone fino a 4K.

## Adattarla a un cliente

Tutto è nel blocco `CONFIG` in cima allo `<script>`:

- `agency`: il nome della tua agenzia
- `currency`: la valuta
- `presets`: una voce per attività. Per un nuovo cliente copia una voce esistente e cambia:
  - `theme`: lo stile grafico (`restaurant`, `salon`, `shop`, `agency`)
  - `name`, `accent` (colore), `tagline`, `heroLine`
  - `people` / `person` (ospiti, clienti…), `bookings`, `bookingNew`, `bookingOne`
  - `avgTicket`: spesa media, usata per le stime dei ricavi
  - `faqs`: parole chiave e risposta dell'assistente; `examples`: domande suggerite
  - `movement`: etichette per entrata, uscita e scarto
  - `inventory`: `[codice, nome, unità, quantità, minimo, costo, fornitore]`
  - `reviews`: `[stelle, nome, testo]`

Gli stili grafici sono nel CSS, sotto `html[data-biz="..."]`. Le automazioni comuni sono nella lista `AUTOMATIONS`.

## Note

- Clienti, recensioni e numeri sono **dati di esempio**. Nessun messaggio viene inviato davvero.
- Le modifiche restano salvate nel browser, separatamente per ogni attività. **Personalizza → Ripristina dati demo** riporta i dati iniziali (serve anche dopo aver cambiato i dati di esempio nel `CONFIG`).
- L'assistente AI in questa demo usa le parole chiave delle `faqs`, così funziona offline. Nella versione per il cliente va collegato a un modello AI e al suo sistema di prenotazione.
