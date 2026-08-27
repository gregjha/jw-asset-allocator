import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCryptoRates } from '../composables/useCryptoRates'

interface Split {
  primaryAmount: number
  secondaryAmount: number
}

const PRIMARY_WEIGHT = 0.7
const SECONDARY_WEIGHT = 0.3

export const useCryptoSplitStore = defineStore('cryptoSplit', () => {
  const { rates, isFetching, error } = useCryptoRates()

  const symbols = computed(() => Object.keys(rates.value).sort())

  const splitFor = computed(() => {
    return (usdAmount: number, primaryCoin: string, secondaryCoin: string): Split | null => {
      const primaryRate = rates.value[primaryCoin]
      const secondaryRate = rates.value[secondaryCoin]
      if (!primaryRate || !secondaryRate) return null
      return {
        primaryAmount: (usdAmount * PRIMARY_WEIGHT) / primaryRate,
        secondaryAmount: (usdAmount * SECONDARY_WEIGHT) / secondaryRate,
      }
    }
  })

  return { rates, isFetching, error, symbols, splitFor }
})
