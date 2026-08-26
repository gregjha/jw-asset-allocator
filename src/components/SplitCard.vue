<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

// A store isn't completely necessary for this assignment, but it is useful in hypothetical feature additions
// with more components needing the crypto conversion data
import { useCryptoSplitStore } from '@/stores/cryptoStore';

const props = defineProps<{
  title?: string;
  defaultUSDAmount?: number
}>()

const store = useCryptoSplitStore();
const usdAmount = ref(props.defaultUSDAmount ?? 1000);
const split = computed(() => store.splitFor(usdAmount.value))

const { isFetching, error } = storeToRefs(store)

const cardOpacity = computed(() => (isFetching ? 0.85 : 1))

</script>

<template>
  <div class="split-card">
    <h2 class="split-card__title">{{title}}</h2>

    <label class="field-label" for="usd-amount">Investable USD Assets</label>
    <input id="usd-amount" v-model.number="usdAmount" type="number" class="text-input" min="0" />

    <div v-if="isFetching && !split" class="status-text">Fetching live conversions...</div>

    <div v-else-if="split" class="split-results">
      <div class="split-row split-row--btc">
        <span class="split-row__label">BTC (70%)</span>
        <span class="split-row__value">{{ split.btcAmount.toFixed(6) }} BTC</span>
      </div>
      <div class="split-row split-row--eth">
        <span class="split-row__label">ETH (30%)</span>
        <span class="split-row__value">{{ split.ethAmount.toFixed(6) }} ETH</span>
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
  background: #fff;
  opacity: v-bind(cardOpacity);
  transition: opacity 0.2s ease;
  text-align: center;

  & .split-card__title {
    margin: 0 0 1.25rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--jw-navy);
  }

  & .text-input,
  & .coin-select {
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: var(--jw-blue);
      box-shadow: 0 0 0 3px rgb(var(--jw-blue-rgb) / 0.18);
    }
  }

  & .coin-select { margin-top: 0.75rem; }
}

.field-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.status-text {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);

  &--warning { color: #B45309; }
  &--subtle { margin-top: 0.75rem; font-size: 0.75rem; }
}

.split-results {
  margin-top: 1.25rem;
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

  &__label { font-weight: 600; color: var(--jw-navy); min-width: 3rem; }

  &__percent {
    width: 3.25rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    padding: 0.25rem 0.375rem;
    font-size: 0.875rem;
    font-family: inherit;

    &:focus { outline: none; border-color: var(--jw-blue); }
  }

  &__value {
    margin-left: auto;
    font-family: 'SFMono-Regular', Consolas, monospace;
    color: var(--jw-navy);
    font-size: 0.9375rem;
  }

  &__remove {
    border: none;
    background: none;
    color: var(--jw-blue);
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    padding: 0 0.25rem;

    &:hover { color: var(--jw-navy); }
  }
}
</style>