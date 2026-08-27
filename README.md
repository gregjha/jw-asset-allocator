# Crypto Asset Allocator

Allows users to calculate how a USD amount converts to a 70/30 split of two selected crypto coins using live Coinbase rates.

## How To Run

```sh
npm install
npm run build

npm run dev       # Run in dev server
npm run preview   # Run in local production build
```

## Architecture
```
src/
├── App.vue                       root app
├── components/
│   ├── AssetAllocator.vue        main component for inputting desired USD assets and crypto assets while displaying results
│   ├── CoinAutocomplete.vue      reusable autocomplete input component
├── stores/
│   └── cryptoStore.ts            global state management for the 
├── composables/
│   └── useCryptoRates.ts         factory composable that handles fetch states, data formatting, and polling
└── assets/
    ├── base.css                  reset + shared .surface-card class
    └── main.css                  entry point (@imports tokens + base)
```

## Design Decisions

- Conversion rates are fetched on mount and then polled continuously for updates. The thought process for this was that crypto assets are generally very volatile and can change value pretty quickly. In order to reduce polling amounts, the polling stops when the user is no longer viewing the page and users have an updated date and time of the last **successful** update. 
- Pinia was used as a global state management library and `cryptoStore.ts` is used as a single source of truth for the most recently updated crypto conversion rates. Global state management was probably overkill for this assignment, but a larger real world project with more components will draw upon the same data and will most certainly need something like this. There are two `AssetAllocator` components rendered to somewhat simulate that situation and to show that the store works correctly. 
- A factory composable, `useCryptoRates.ts`, handles fetch and polling. It's wrapped in the global store since the composable exposes the properly formatted conversion rate data from the Coinbase API and fetch states, which now every component can access through the store.
- An autocomplete input component, `CoinAutocomplete`, is used to allow the user to search for their desired crypto currency, since the list of currencies is pretty big. In a real world situation, this would probably be a base component that is reusable across a whole codebase or imported from a component library and not actually built out. For the sake of this project, I built one just to try it out in Vue.
