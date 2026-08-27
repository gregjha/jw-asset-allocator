import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AssetAllocator from '../AssetAllocator.vue'
import { useCryptoSplitStore } from '@/stores/cryptoStore'

function mockFetch(rates: Record<string, string>) {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: { rates } }),
    } as unknown as Response),
  )
}

const SAMPLE_RATES = { BTC: '0.00001', ETH: '0.0005' }

describe('AssetAllocator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    useCryptoSplitStore().$dispose()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('renders the title prop', async () => {
    vi.stubGlobal('fetch', mockFetch(SAMPLE_RATES))
    const wrapper = mount(AssetAllocator, { props: { title: 'My Allocator' } })
    await flushPromises()
    expect(wrapper.get('h2').text()).toBe('My Allocator')
  })

  it('shows a fetching message before rates arrive, then the computed split', async () => {
    vi.stubGlobal('fetch', mockFetch(SAMPLE_RATES))
    const wrapper = mount(AssetAllocator, { props: { defaultUSDAmount: 1000 } })
    expect(wrapper.text()).toContain('Fetching live conversions')

    await flushPromises()

    const values = wrapper.findAll('.split-row__value').map((v) => v.text())
    expect(values).toEqual(['0.00700000 BTC', '0.15000000 ETH'])
  })

  it('shows an error message when the initial fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 500 } as Response)),
    )
    const wrapper = mount(AssetAllocator)
    await flushPromises()
    expect(wrapper.text()).toContain('Error fetching conversions')
  })

  it('rounds the USD amount input to two decimal places', async () => {
    vi.stubGlobal('fetch', mockFetch(SAMPLE_RATES))
    const wrapper = mount(AssetAllocator)
    await flushPromises()

    const usdInput = wrapper.get('input[type="number"]')
    await usdInput.setValue(100.126)
    expect((usdInput.element as HTMLInputElement).valueAsNumber).toBe(100.13)
  })

  it('disables the refresh button while fetching and when throttled, then re-enables', async () => {
    vi.stubGlobal('fetch', mockFetch(SAMPLE_RATES))
    const wrapper = mount(AssetAllocator)
    await flushPromises()

    const button = wrapper.get('button.refresh-button')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.text()).toBe('Update')

    let resolveFetch: (value: unknown) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise((resolve) => (resolveFetch = resolve))),
    )

    await button.trigger('click')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toBe('Updating...')

    resolveFetch({ ok: true, json: () => Promise.resolve({ data: { rates: SAMPLE_RATES } }) })
    await flushPromises()
    expect(button.text()).toBe('Recently Updated')
    expect(button.attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(5000)
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.text()).toBe('Update')
  })
})
