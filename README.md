# Crypto Asset Allocator

Allows users to calculate how a USD amount converts to a 70/30 split of two selected crypto coins using live Coinbase rates.

## How To Run

```sh
npm install
npm run build

npm run dev       # Run in dev server
npm run preview   # Run in local production build
npm run test:unit # Run component unit tests
```

## File Structure

```
src/
├── App.vue
├── components/
│   ├── AssetAllocator.vue
│   ├── AutocompleteInput.vue
├── stores/
│   └── cryptoStore.ts
├── composables/
│   └── useCryptoRates.ts
└── assets/
    ├── base.css
    └── main.css
```

## Design Decisions

- There are multiple instances where utility libraries like VueUse could've been used, such as for the polling intervals. I chose not to use them for the sake of this project and to be able to learn more about the Vue ecosystem. I also wanted to generally reduce dependency use for this project, to demonstrate understanding of some functionalities.
- Conversion rates are fetched on mount and then polled continuously for updates, in this case every 30 seconds and can be changed in the codebase. The thought process for this was that crypto assets are generally very volatile and can change value pretty quickly. In order to reduce polling amounts, the polling stops when the user is no longer viewing the page and users have an updated date and time of the last **successful** update. In a real world project with a more robust backend, the app would probably use websockets or SSE to get continuous updates on the crypto rates, and there would be probably more targeted API calls for specific coins rather than a full conversion table every call.
- Users can also manually refresh the conversion rates on demand if they want a quicker update. A throttle is added for the manual refresh to prevent users from calling the API to frequently. This was not completely necessary, but wanted to add multiple options for the project.
- Pinia was used as a global state management library and `cryptoStore` is used as a single source of truth for the most recently updated crypto conversion rates. Global state management was probably overkill for this assignment, but a larger real world project with more components will draw upon the same data and will most certainly need something like this. There are two `AssetAllocator` components rendered to somewhat simulate that situation and to show that the store provides data correctly to each component while each `AssetAllocator` still handles the data locally.
- A factory composable, `useCryptoRates`, handles fetch and polling. It's wrapped in the global store since the composable exposes the properly formatted conversion rate data from the Coinbase API and fetch states, which now every component can access through the store.
- An autocomplete input component, `AutocompleteInput`, is used to allow the user to search for their desired crypto currency, since the list of currencies is pretty big. In a real world situation, this would probably be a base component that is reusable across a whole codebase or imported from a component library and not actually built out. The component in this project is still pretty reusable for any kinds of data, not just a list of crypto coins. For the sake of this project, I built one just to try it out in Vue.
- Testing wasn't asked for for this assignment, so there are no end-to-end tests, but some unit tests were added just to help show what is expected out of the components.
