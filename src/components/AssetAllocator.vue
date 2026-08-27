<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

// A store isn't completely necessary for this assignment, but it is extremely useful in a realistic bigger feature where more potential components could consume the same crypto conversion data table
import { useCryptoSplitStore } from '@/stores/cryptoStore';
import AutocompleteInput from './AutocompleteInput.vue';

const props = defineProps<{
  title?: string;
  defaultUSDAmount?: number
}>()

const store = useCryptoSplitStore();
const { isFetching, error, symbols, lastUpdated } = storeToRefs(store);

const primaryCoin = ref('BTC');
const secondaryCoin = ref('ETH');
const usdAmount = ref(props.defaultUSDAmount ?? 1000);

const primaryCoinOptions = computed(() => symbols.value.filter((s) => s !== secondaryCoin.value));
const secondaryCoinOptions = computed(() => symbols.value.filter((s) => s !== primaryCoin.value));
const split = computed(() => store.splitFor(usdAmount.value, primaryCoin.value, secondaryCoin.value))
const cardOpacity = computed(() => (isFetching.value ? 0.85 : 1))
const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) return null;
  return lastUpdated.value.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
})

watch(usdAmount, (newValue) => {
  if (typeof newValue !== 'number' || !Number.isFinite(newValue)) return;
  const rounded = Math.round(newValue * 100) / 100;
  if (rounded !== newValue) usdAmount.value = rounded;
});

</script>

<template>
  <div class="split-card">
    <h2 class="split-card__title">{{title}}</h2>
    
    <div class="field-container">
        <label class="field-label" for="usd-amount">Investable USD Assets</label>
        <div class="currency-input">
          <span class="currency-input__symbol">$</span>
          <input id="usd-amount" v-model.number="usdAmount" type="number" class="text-input" min="0" step="0.01" />
        </div>
    </div>

    <div class="field-container">
      <AutocompleteInput id="primary-coin" label="Primary Coin (70%)" v-model="primaryCoin" :options="primaryCoinOptions" />
    </div>

    <div class="field-container">
      <AutocompleteInput id="secondary-coin" label="Secondary Coin (30%)" v-model="secondaryCoin" :options="secondaryCoinOptions" />
    </div>

    <div v-if="isFetching && !split" class="status-text" aria-live="polite">Fetching live conversions...</div>

    <div v-else-if="split" class="split-results" aria-live="polite" aria-atomic="true">
      <div class="split-row">
        <span class="split-row__label">{{ primaryCoin }} (70%)</span>
        <span class="split-row__value">{{ split.primaryAmount.toFixed(8) }} {{ primaryCoin }}</span>
      </div>
      <div class="split-row">
        <span class="split-row__label">{{ secondaryCoin }} (30%)</span>
        <span class="split-row__value">{{ split.secondaryAmount.toFixed(8) }} {{ secondaryCoin }}</span>
      </div>
    </div>

    <div v-if="lastUpdatedLabel" class="status-text status-text--subtle">Last updated {{ lastUpdatedLabel }}</div>

    <!-- Error state if initial conversions can't be fetched -->
    <div v-if="error && !split" class="status-text--warning" role="alert">
        Error fetching conversions, please try again later.
    </div>

    <!-- Error message to show below last conversions if refresh fetch errors -->
    <div v-if="error && split" class="status-text--warning" role="alert">
        Error refreshing live conversion, shown conversions may not be current.
    </div>
  </div>
</template>

<style scoped>
.split-card {
  max-width: 28rem;
  margin: 2.5rem auto 0;
  padding: 1.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 6px 10px -2px rgb(var(--color-shadow-rgb) / 0.25), 0 24px 48px rgb(var(--color-shadow-rgb) / 0.30);
  background: var(--color-surface);
  opacity: v-bind(cardOpacity);
  transition: opacity 0.2s ease;
  text-align: left;

  & .split-card__title {
    margin: 0 0 1.25rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--jw-navy);
  }
}

.field-container {
    margin-bottom: 1.25rem;
}

.currency-input {
  position: relative;
}

.currency-input__symbol {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.currency-input .text-input {
  padding-left: 1.75rem;
}

.status-text {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.status-text--warning { margin-top: 0.75rem; font-size: 0.75rem; color: var(--color-error); }
.status-text--subtle { margin-top: 0.75rem; font-size: 0.75rem; }

.split-results {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.split-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.125rem;
  border-radius: var(--radius-md);
  background: var(--jw-blue-light);
  border-left: 3px solid var(--jw-blue);
}

.split-row__label { font-weight: 600; color: var(--jw-navy); min-width: 3rem; }

.split-row__percent {
  width: 3.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.25rem 0.375rem;
  font-size: 0.875rem;
  font-family: inherit;
}

.split-row__percent:focus { outline: none; border-color: var(--jw-blue); }

.split-row__value {
  margin-left: auto;
  font-family: 'SFMono-Regular', Consolas, monospace;
  color: var(--jw-navy);
  font-size: 0.9375rem;
}

.split-row__remove {
  border: none;
  background: none;
  color: var(--jw-blue);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 0.25rem;
}

.split-row__remove:hover { color: var(--jw-navy); }
</style>