import { ref, onScopeDispose } from 'vue'

const REFRESH_COOLDOWN_MS = 5000

export function useCryptoRates(intervalMs = 10000) {
  const rates = ref<Record<string, number>>({})
  const isFetching = ref(false)
  const isRefreshThrottled = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  async function fetchRates() {
    isFetching.value = true
    error.value = null
    try {
      const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD')
      if (!res.ok) throw new Error(`Coinbase API error: ${res.status}`)
      const { data } = (await res.json()) as { data: { rates: Record<string, string> } }

      const next: Record<string, number> = {}
      for (const [symbol, rate] of Object.entries(data.rates)) {
        next[symbol] = 1 / parseFloat(rate)
      }
      rates.value = next
      lastUpdated.value = new Date()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch rates'
    } finally {
      isFetching.value = false
    }
  }

  let intervalId: ReturnType<typeof setInterval> | null
  let throttleTimeoutId: ReturnType<typeof setTimeout> | null = null
  let lastRefreshAt = 0

  async function refresh() {
    const now = Date.now()
    if (now - lastRefreshAt < REFRESH_COOLDOWN_MS) return
    lastRefreshAt = now

    // Throttle to prevent user from spamming manual refresh, causing too many fetch updates
    isRefreshThrottled.value = true
    if (throttleTimeoutId) clearTimeout(throttleTimeoutId)
    throttleTimeoutId = setTimeout(() => {
      isRefreshThrottled.value = false
      throttleTimeoutId = null
    }, REFRESH_COOLDOWN_MS)

    await fetchRates()
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = setInterval(fetchRates, intervalMs)
    }
  }

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

  startPolling()
  document.addEventListener('visibilitychange', handleVisibilityChange)

  onScopeDispose(() => {
    stopPolling()
    if (throttleTimeoutId) clearTimeout(throttleTimeoutId)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return { rates, isFetching, isRefreshThrottled, error, lastUpdated, refresh }
}
