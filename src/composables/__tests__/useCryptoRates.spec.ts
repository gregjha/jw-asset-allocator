import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, type EffectScope } from 'vue'
import { useCryptoRates } from '../useCryptoRates'

function mockFetch(rates: Record<string, string>) {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: { rates } }),
    } as unknown as Response),
  )
}

const SAMPLE_RATES = { BTC: '0.00001', ETH: '0.0005' }

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useCryptoRates', () => {
  let scope: EffectScope

  beforeEach(() => {
    vi.useFakeTimers()
    setDocumentHidden(false)
    scope = effectScope()
  })

  afterEach(() => {
    scope.stop()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function setup(intervalMs?: number) {
    return scope.run(() => useCryptoRates(intervalMs))!
  }

  it('fetches immediately on creation and maps rates to USD price per unit', async () => {
    vi.stubGlobal('fetch', mockFetch(SAMPLE_RATES))
    const { rates, isFetching, lastUpdated } = setup(10000)

    expect(isFetching.value).toBe(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(isFetching.value).toBe(false)
    expect(rates.value.BTC).toBeCloseTo(100000)
    expect(rates.value.ETH).toBeCloseTo(2000)
    expect(lastUpdated.value).toBeInstanceOf(Date)
  })

  it('polls again after the configured interval', async () => {
    const fetchMock = mockFetch(SAMPLE_RATES)
    vi.stubGlobal('fetch', fetchMock)
    setup(10000)
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(10000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('sets an error message and clears isFetching when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.resolve({ ok: false, status: 500 } as Response)),
    )
    const { error, isFetching } = setup(10000)
    await vi.advanceTimersByTimeAsync(0)

    expect(isFetching.value).toBe(false)
    expect(error.value).toContain('500')
  })

  describe('document visibility', () => {
    it('stops polling while the tab is hidden', async () => {
      const fetchMock = mockFetch(SAMPLE_RATES)
      vi.stubGlobal('fetch', fetchMock)
      setup(10000)
      await vi.advanceTimersByTimeAsync(0)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      setDocumentHidden(true)
      await vi.advanceTimersByTimeAsync(30000)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('fetches immediately and resumes polling when the tab becomes visible again', async () => {
      const fetchMock = mockFetch(SAMPLE_RATES)
      vi.stubGlobal('fetch', fetchMock)
      setup(10000)
      await vi.advanceTimersByTimeAsync(0)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      setDocumentHidden(true)
      setDocumentHidden(false)
      await vi.advanceTimersByTimeAsync(0)
      expect(fetchMock).toHaveBeenCalledTimes(2)

      await vi.advanceTimersByTimeAsync(10000)
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('removes the visibilitychange listener on scope dispose', async () => {
      const fetchMock = mockFetch(SAMPLE_RATES)
      vi.stubGlobal('fetch', fetchMock)
      const removeSpy = vi.spyOn(document, 'removeEventListener')
      setup(10000)
      await vi.advanceTimersByTimeAsync(0)

      scope.stop()
      expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))

      setDocumentHidden(true)
      setDocumentHidden(false)
      await vi.advanceTimersByTimeAsync(10000)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      removeSpy.mockRestore()
    })
  })

  describe('manual refresh', () => {
    it('resets the poll timer so the next automatic fetch is a full interval away', async () => {
      const fetchMock = mockFetch(SAMPLE_RATES)
      vi.stubGlobal('fetch', fetchMock)
      const { refresh } = setup(10000)
      await vi.advanceTimersByTimeAsync(0)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(7000)
      await refresh()
      expect(fetchMock).toHaveBeenCalledTimes(2)

      // The original schedule would have fired 3s from here; confirm it doesn't.
      await vi.advanceTimersByTimeAsync(3000)
      expect(fetchMock).toHaveBeenCalledTimes(2)

      await vi.advanceTimersByTimeAsync(7000)
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('throttles repeated manual refreshes within the cooldown window', async () => {
      const fetchMock = mockFetch(SAMPLE_RATES)
      vi.stubGlobal('fetch', fetchMock)
      const { refresh, isRefreshThrottled } = setup(30000)
      await vi.advanceTimersByTimeAsync(0)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      await refresh()
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(isRefreshThrottled.value).toBe(true)

      await refresh()
      await refresh()
      expect(fetchMock).toHaveBeenCalledTimes(2)

      await vi.advanceTimersByTimeAsync(5000)
      expect(isRefreshThrottled.value).toBe(false)

      await refresh()
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('does not restart the poll interval from a manual refresh while polling is stopped', async () => {
      const fetchMock = mockFetch(SAMPLE_RATES)
      vi.stubGlobal('fetch', fetchMock)
      const { refresh } = setup(10000)
      await vi.advanceTimersByTimeAsync(0)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      setDocumentHidden(true)
      await refresh()
      expect(fetchMock).toHaveBeenCalledTimes(2)

      await vi.advanceTimersByTimeAsync(20000)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
