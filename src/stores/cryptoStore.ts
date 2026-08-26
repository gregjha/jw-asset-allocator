import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCryptoRates } from '../composables/useCryptoRates'

interface Split {
  btcAmount: number
  ethAmount: number
}

export const useCryptoSplitStore = defineStore('cryptoSplit', () => {
  const { rates, isFetching, error } = useCryptoRates(['BTC', 'ETH'])

  const splitFor = computed(() => {
    return (usdAmount: number): Split | null => {
      if (!rates.value.BTC || !rates.value.ETH) return null
      return {
        btcAmount: (usdAmount * 0.7) / rates.value.BTC,
        ethAmount: (usdAmount * 0.3) / rates.value.ETH,
      }
    }
  })

  return { rates, isFetching, error, splitFor }
})