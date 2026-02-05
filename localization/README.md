# @gaddario98/react-localization

Un pacchetto flessibile per la gestione delle traduzioni in applicazioni React e Next.js.

## Caratteristiche

- ✅ Supporto per vari framework (React, Next.js)
- ✅ Adapter personalizzabili per diversi sistemi di traduzione (i18next, next-intl, next-i18next)
- ✅ Supporto per SSR (Server Side Rendering)
- ✅ API consistente indipendentemente dal sistema sottostante
- ✅ Inizializzazione personalizzabile
- ✅ Funzionamento offline con traduzioni statiche

## Installazione

```bash
npm install @gaddario98/react-localization

# Peer dependencies
npm install i18next react-i18next
```

## Utilizzo Base

### Inizializzazione

```tsx
import { initializeI18n } from '@gaddario98/react-localization';

// Definizione delle risorse di traduzione
const resources = {
  it: {
    common: {
      hello: 'Ciao',
      welcome: 'Benvenuto, {{name}}!',
    },
  },
  en: {
    common: {
      hello: 'Hello',
      welcome: 'Welcome, {{name}}!',
    },
  },
};

// Inizializzazione con opzioni personalizzate
initializeI18n(resources, {
  defaultLanguage: 'it',
  fallbackLanguage: 'en',
  debug: process.env.NODE_ENV === 'development',
});
```

### Traduzione nei componenti

```tsx
import React from 'react';
import { useTranslatedText } from '@gaddario98/react-localization';

const MyComponent = () => {
  const { traslateText } = useTranslatedText('common');
  
  return (
    <div>
      <h1>{traslateText('hello')}</h1>
      <p>{traslateText('welcome', { name: 'Mario' })}</p>
    </div>
  );
};
```

## Personalizzazione Avanzata

### Uso con Next.js e next-intl

```tsx
// _app.tsx
import { setTranslationAdapter, adapters } from '@gaddario98/react-localization';

// Configura l'adapter per next-intl
setTranslationAdapter(adapters.nextIntl());

// Il resto dell'app...
```

### Traduzioni statiche (senza dipendenze esterne)

```tsx
import { setTranslationAdapter, adapters } from '@gaddario98/react-localization';

// Definisci le traduzioni direttamente
const translations = {
  common: {
    hello: 'Ciao',
    welcome: 'Benvenuto, {{name}}!',
  },
};

// Configura l'adapter statico
setTranslationAdapter(adapters.static(translations));
```

### Inizializzazione personalizzata

```tsx
import { setI18nInitializer } from '@gaddario98/react-localization';
import i18n from 'i18next';
import Backend from 'i18next-http-backend';

// Configura una funzione di inizializzazione personalizzata
setI18nInitializer((resources, options) => {
  i18n
    .use(Backend) // Aggiungi il backend HTTP per caricare traduzioni remote
    .init({
      lng: options.defaultLanguage || 'en',
      resources,
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        ...options.backend,
      },
      // Altre opzioni...
    });
});
```

## Adapter predefiniti

Il pacchetto fornisce diversi adapter predefiniti:

- `adapters.reactI18next()`: Per React con react-i18next
- `adapters.i18next()`: Per utilizzo diretto di i18next
- `adapters.static()`: Per traduzioni statiche senza dipendenze esterne
- `adapters.nextIntl()`: Per Next.js con next-intl
- `adapters.nextI18next()`: Per Next.js con next-i18next

## Creazione di un adapter personalizzato

```tsx
import { setTranslationAdapter } from '@gaddario98/react-localization';

// Crea un adapter personalizzato
setTranslationAdapter({
  getTranslator: (namespace) => {
    // Implementa la tua logica di traduzione qui
    return {
      translate: (key, options) => {
        // La tua implementazione...
        return key; // Fallback
      }
    };
  }
});
```

## API Reference

### Hooks

- `useTranslatedText(namespace?)`: Hook principale per le traduzioni
- `useTranslation`: Re-export di react-i18next per retrocompatibilità

### Funzioni di configurazione

- `initializeI18n(resources, options?)`: Inizializza il sistema di traduzione
- `setI18nInitializer(initializer)`: Configura un inizializzatore personalizzato
- `setTranslationAdapter(adapter)`: Configura un adapter personalizzato per le traduzioni

### Adapter predefiniti

- `adapters.reactI18next()`: Per React con react-i18next
- `adapters.i18next(i18nInstance?)`: Per utilizzo diretto di i18next
- `adapters.static(translations)`: Per traduzioni statiche
- `adapters.nextIntl()`: Per Next.js con next-intl
- `adapters.nextI18next()`: Per Next.js con next-i18next
