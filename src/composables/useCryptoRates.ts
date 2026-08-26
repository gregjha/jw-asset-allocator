import { ref, onMounted, onUnmounted } from 'vue'

export function useCryptoRates(symbols: string[], intervalMs = 10000) {
  const rates = ref<Record<string, number>>({})
  const isFetching = ref(false)
  const error = ref<string | null>(null)

  async function fetchRates() {
    isFetching.value = true
    error.value = null
    try {
      const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD')
      if (!res.ok) throw new Error(`Coinbase API error: ${res.status}`)
      const { data } = await res.json() as { data: { rates: Record<string, string> } }

      // API returns "1 USD = X <symbol>" — invert to get USD price per unit
      const next: Record<string, number> = {}
      for (const symbol of symbols) {
        const rate = data.rates[symbol]
        if (rate === undefined) {
          console.warn(`No rate returned for ${symbol}`)
          continue
        }
        next[symbol] = 1 / parseFloat(rate)
      }
      rates.value = next
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch rates'
    } finally {
      isFetching.value = false
    }
  }

  let intervalId: ReturnType<typeof setInterval> | null;

  function startPolling() {
    if (intervalId) return
    fetchRates()
    intervalId = setInterval(fetchRates, intervalMs)
  }

  function stopPolling() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // Stop polling if user is not viewing the component
  function handleVisibilityChange() {
    if (document.hidden) {
      stopPolling()
    } else {
      startPolling()
    }
  }

  onMounted(() => {
    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    stopPolling()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return { rates, isFetching, error }
}