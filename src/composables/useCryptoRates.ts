import { ref, onScopeDispose } from 'vue'

export function useCryptoRates(intervalMs = 10000) {
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

      const next: Record<string, number> = {}
      for (const [symbol, rate] of Object.entries(data.rates)) {
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

  // Uses onScopeDispose (not onMounted/onUnmounted) so this also works
  // when called from inside a Pinia store's setup, whose effect scope
  // is independent of whichever component first instantiates the store.
  startPolling()
  document.addEventListener('visibilitychange', handleVisibilityChange)

  onScopeDispose(() => {
    stopPolling()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return { rates, isFetching, error }
}
