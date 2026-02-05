# Piano di miglioramento: plugin `pages`

> Obiettivo: rendere `pages` più solido per SSR/Next.js, più completo lato SEO/metadata (Open Graph, Twitter Card, structured data) e più “LLM-friendly” (es. `llms.txt`), senza perdere la natura multipiattaforma (web + React Native).

## 0) Stato attuale (repo)

Componenti e hook principali:
- `MetadataManager` calcola i metadati e chiama `setMetadata()` via `useEffect`.
- `useMetadata` valuta `meta` (oggetto o funzione) e traduce alcuni campi; applica `setMetadata()` via `useEffect` quando `document` esiste.
- `setMetadata/getMetadata` mantengono uno “store” globale (`currentMetadata`) e (su web) manipolano direttamente `<head>`.

Osservazioni importanti (per SSR):
- In SSR React, `useEffect` non viene eseguito: quindi oggi i metadati **non vengono salvati né applicati** sul server durante il rendering.
- `currentMetadata` è variabile a livello di modulo: in SSR Node può diventare **condivisa tra richieste** (rischio “data leak” cross-request).
- `MetadataConfig` e `setMetadata` sembrano avere qualche disallineamento (es. `canonical` usato ma non tipizzato; `lang` vs `documentLang`).

## 1) Feature più richieste per pagine web/app (React / Next / React Native)

### Web/Next (priorità alta)
- SEO base: `<title>`, `description`, `canonical`, `robots`.
- Social sharing: Open Graph + Twitter Card (immagini, alt, dimensioni, type article/website).
- Structured data JSON-LD (schema.org): `WebSite`, `Organization`, `BreadcrumbList`, `Article`, `Product`, `FAQPage`.
- i18n SEO: `hreflang` / alternates, locale in OG.
- Performance/UX: Core Web Vitals (LCP/INP/CLS), lazy loading, immagini ottimizzate.
- SSR/SSG/ISR: metadata risolta lato server, caching/revalidate, streaming metadata (Next App Router).
- Sitemap + robots.txt generati automaticamente (specie in Next).

### React Native (priorità media)
- Deep linking / universal links + app links.
- “Share cards” (di fatto è sempre Open Graph lato web; lato RN servono link corretti e fallback).
- Gestione “screen metadata” (analytics, screen name, breadcrumbs interni) più che SEO.

### “LLM-friendly” (priorità crescente)
- `llms.txt` in root (o path noto) + versioni `.md` delle pagine/documentazione.
- Pagine con contenuto pulito (ridurre “chrome” inutile), heading coerenti (`h1` unico), dati strutturati.
- Sitemap e robots ben configurati: aiutano sia SEO sia discovery.

## 2) Roadmap (fasi)

### Fase A — Stabilizzare SSR e tipizzazione (fondamentale)
**Deliverable**: metadati corretti e isolati per-request in SSR.

1. **Separare “risoluzione” da “applicazione”**
   - Estrarre una funzione pura: `resolveMetadata(meta, {get,set,t,locale,...}) -> MetadataConfig`.
   - In client: `applyMetadataToDom(resolved)`.
   - In server: `collectMetadata(resolved)` (senza DOM).

2. **Rendere lo store SSR request-scoped**
   - Evitare `let currentMetadata` globale.
   - Opzioni:
     - (A) “Store esplicito”: `createMetadataStore()` e passarlo via context/provider per richiesta.
     - (B) `AsyncLocalStorage` (Node) per mantenere store per-request.
   - Aggiungere API: `getMetadata(store?)`, `setMetadata(store?, meta)`.

3. **Far funzionare davvero SSR**
   - In SSR non puoi affidarti a `useEffect`.
   - Pattern consigliato:
     - In `MetadataManager`, se `typeof document === 'undefined'`, chiamare la raccolta **durante render** (sincrono).
     - Oppure demandare tutto a integrazione framework (vedi Fase B) e rendere `MetadataManager` client-only.

4. **Allineare tipi e campi**
   - Uniformare: `lang` vs `documentLang`.
   - Aggiungere `canonical` a `MetadataConfig` (o rimuovere supporto se non desiderato).
   - Validare Open Graph (immagini assolute, type, locale).

**Acceptance criteria**
- In SSR, ogni request ottiene i suoi metadati, senza contaminazione.
- In client, la manipolazione `<head>` rimane stabile (no duplicazioni).

### Fase B — Integrazione “first-class” con Next.js (App Router + Pages Router)
**Deliverable**: helper ufficiali per usare `pages` in Next con SSR/SSG.

1. **Helper per App Router** (`generateMetadata`)
   - `toNextMetadata(resolved: MetadataConfig): Metadata` (mappatura campi)
   - Supportare: `openGraph.images[]`, `twitter`, `robots`, `alternates.canonical`, `metadataBase`.
   - Documentare streaming metadata e caching (Next).

2. **Helper per Pages Router** (`next/head`)
   - Componente `NextHeadFromMetadata` che renderizza tag deterministici.
   - Evitare side effects; puro rendering.

3. **Sitemap/robots**
   - Aggiungere una funzione per generare liste URL (anche solo “hook points”).
   - Per Next App Router: guide per implementare `app/sitemap.ts` e `app/robots.ts` usando la config delle pagine.

**Acceptance criteria**
- Un consumer Next può ottenere metadata completa senza hack.

### Fase C — SEO & Social: completare i metadati moderni
**Deliverable**: `MetadataConfig` più completo (senza gonfiare troppo la API).

1. **Twitter Card**
   - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.

2. **Open Graph avanzato**
   - `og:image` multiplo + `og:image:alt`, width/height.
   - `article:published_time`, `article:modified_time`, `article:author` (quando `type=article`).

3. **Alternates / hreflang**
   - `alternates: { canonical, languages }` (stile Next Metadata API).

4. **Icons / Manifest / PWA basics**
   - `link[rel=icon]`, `apple-touch-icon`, `manifest`.

5. **Structured data “builder”**
   - Helpers per generare JSON-LD corretti per casi comuni:
     - `buildOrganizationJsonLd`, `buildWebSiteJsonLd`, `buildBreadcrumbListJsonLd`, `buildArticleJsonLd`.

**Acceptance criteria**
- Condivisione social consistente (preview corretto).
- Rich results più probabili (JSON-LD valido).

### Fase D — “LLM-friendly” (llms.txt + markdown endpoints)
**Deliverable**: la tua app può esporre un set curato di contenuti per LLM/agent.

1. **Aggiungere supporto `llms.txt`**
   - Produrre un file `llms.txt` (in root del sito) che elenca documentazione e pagine utili.
   - Tenere la lista “curata” (non un dump completo come sitemap).

2. **Versioni markdown delle pagine**
   - Per pagine importanti: endpoint `.md` (o route separata) con contenuto pulito.
   - Mettere heading coerenti, evitare contenuti duplicati e frammenti inutili.

3. **Metadati “AI” realistici**
   - I meta tag custom tipo `ai-*` non sono standard web affermati.
   - Meglio:
     - `llms.txt` + `.md` + JSON-LD + contenuto accessibile.
     - Eventuali header HTTP (es. per cache) e robots/noindex dove serve.

**Acceptance criteria**
- Un agente può trovare rapidamente “che cos’è questo sito/prodotto” e la doc.

### Fase E — DX e qualità del plugin
**Deliverable**: mantenibilità e debug.

- Logging opzionale e tracciabile (dev-only): cosa viene risolto, cosa viene applicato.
- Test:
  - unit test su `resolveMetadata` (puro).
  - test SSR: isolamento tra richieste.
  - snapshot dei tag `<head>` (web).
- Documentazione d’uso:
  - React SPA
  - Next App Router
  - Next Pages Router
  - React Native (cosa è supportato e cosa no)

## 3) Quick wins (1–2 giorni)
- Sistemare disallineamenti di tipo (`canonical`, `lang/documentLang`).
- Far sì che in ambiente server i metadati vengano almeno **risolti e resi disponibili** (anche prima di costruire l’integrazione completa per-request).
- Aggiungere Twitter Card basilare.

## 4) Riferimenti (ricerca web)
- Next.js Metadata API (`generateMetadata`): https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Open Graph protocol: https://ogp.me/
- Google Search: structured data intro: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google Search: title link best practices: https://developers.google.com/search/docs/appearance/title-link
- robots.txt spec (Google / RFC 9309): https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
- sitemap overview: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- Web Vitals: https://web.dev/vitals/
- llms.txt proposal: https://llmstxt.org/
