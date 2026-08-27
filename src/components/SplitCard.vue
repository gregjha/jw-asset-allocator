<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

// A store isn't completely necessary for this assignment, but it is extremely useful in a realistic bigger feature where more potential components could consume the same crypto conversion data
import { useCryptoSplitStore } from '@/stores/cryptoStore';
import CoinAutocomplete from './CoinAutocomplete.vue';

const props = defineProps<{
  title?: string;
  defaultUSDAmount?: number
}>()

const primaryCoin = ref('BTC');
const secondaryCoin = ref('ETH');

const store = useCryptoSplitStore();
const { isFetching, error, symbols } = storeToRefs(store);

const primaryCoinOptions = computed(() => symbols.value.filter((s) => s !== secondaryCoin.value));
const secondaryCoinOptions = computed(() => symbols.value.filter((s) => s !== primaryCoin.value));

const usdAmount = ref(props.defaultUSDAmount ?? 1000);

watch(usdAmount, (newValue) => {
  if (typeof newValue !== 'number' || !Number.isFinite(newValue)) return;
  const rounded = Math.round(value * 100) / 100;
  if (rounded !== newValue) usdAmount.value = rounded;
});


const split = computed(() => store.splitFor(usdAmount.value, primaryCoin.value, secondaryCoin.value))
const cardOpacity = computed(() => (isFetching.value ? 0.85 : 1))

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
      <CoinAutocomplete id="primary-coin" label="Primary Coin (70%)" v-model="primaryCoin" :options="primaryCoinOptions" />
    </div>

    <div class="field-container">
      <CoinAutocomplete id="secondary-coin" label="Secondary Coin (30%)" v-model="secondaryCoin" :options="secondaryCoinOptions" />
    </div>

    <div v-if="isFetching && !split" class="status-text">Fetching live conversions...</div>

    <div v-else-if="split" class="split-results">
      <div class="split-row split-row--primary">
        <span class="split-row__label">{{ primaryCoin }} (70%)</span>
        <span class="split-row__value">{{ split.primaryAmount.toFixed(6) }} {{ primaryCoin }}</span>
      </div>
      <div class="split-row split-row--secondary">
        <span class="split-row__label">{{ secondaryCoin }} (30%)</span>
        <span class="split-row__value">{{ split.secondaryAmount.toFixed(6) }} {{ secondaryCoin }}</span>
      </div>
    </div>
    
    <!-- Error state if initial conversions can't be fetched -->
    <div v-if="error && !split" class="status-text">
        Error fetching conversions, please try again later.
    </div>

    <!-- Error message to show below last conversions if refresh fetch errors -->
    <div v-if="error && split" class="status-text">
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
  box-shadow: 0 2px 8px rgb(var(--jw-navy-rgb) / 0.08);
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

.status-text--warning { color: #B45309; }
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
  border-radius: 0.25rem;
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