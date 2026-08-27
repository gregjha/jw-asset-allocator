import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AutocompleteInput from '../AutocompleteInput.vue'

function mountInput(options = ['BTC', 'ETH', 'SOL'], modelValue = 'BTC') {
  return mount(AutocompleteInput, {
    props: { id: 'coin', label: 'Coin', modelValue, options },
  })
}

describe('AutocompleteInput', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the label and the current value', () => {
    const wrapper = mountInput()
    expect(wrapper.find('label').text()).toBe('Coin')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('BTC')
  })

  it('opens the dropdown and lists all options when the input changes', async () => {
    const wrapper = mountInput(['BTC', 'ETH', 'SOL'])
    await wrapper.find('input').setValue('')
    const options = wrapper.findAll('li[role="option"]')
    expect(options.map((o) => o.text())).toEqual(['BTC', 'ETH', 'SOL'])
  })

  it('filters options by substring match, case-insensitively, capped at 5', async () => {
    const wrapper = mountInput(['BTC', 'ETH', 'BCH', 'BNB', 'BUSD', 'BAT', 'BAL'])
    await wrapper.find('input').setValue('b')
    const options = wrapper.findAll('li[role="option"]')
    expect(options.map((o) => o.text())).toEqual(['BTC', 'BCH', 'BNB', 'BUSD', 'BAT'])
  })

  it('shows a "No matches" message when nothing matches the query', async () => {
    const wrapper = mountInput(['BTC', 'ETH'])
    await wrapper.find('input').setValue('zzz')
    expect(wrapper.find('.autocomplete__empty').text()).toBe('No matches')
  })

  it('selecting an option emits update:modelValue and closes the dropdown', async () => {
    const wrapper = mountInput(['BTC', 'ETH'], 'BTC')
    await wrapper.find('input').setValue('')
    await wrapper.findAll('li[role="option"]')[1]!.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')).toEqual([['ETH']])
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('syncs the displayed query when modelValue changes externally', async () => {
    const wrapper = mountInput(['BTC', 'ETH'], 'BTC')
    await wrapper.setProps({ modelValue: 'ETH' })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('ETH')
  })

  it('selects the existing text when the input gains focus', async () => {
    const selectSpy = vi.spyOn(HTMLInputElement.prototype, 'select').mockImplementation(() => {})
    const wrapper = mountInput()
    await wrapper.find('input').trigger('focus')
    expect(selectSpy).toHaveBeenCalledTimes(1)
    selectSpy.mockRestore()
  })

  describe('keyboard navigation', () => {
    it('ArrowDown opens a closed dropdown without selecting an option yet', async () => {
      const wrapper = mountInput()
      expect(wrapper.find('ul').exists()).toBe(false)
      await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
      expect(wrapper.find('ul').exists()).toBe(true)
      expect(wrapper.find('[aria-selected="true"]').exists()).toBe(false)
    })

    it('ArrowDown/ArrowUp move the active option and wrap around', async () => {
      const wrapper = mountInput(['BTC', 'ETH', 'SOL'])
      const input = wrapper.find('input')
      await input.setValue('')

      await input.trigger('keydown', { key: 'ArrowDown' })
      expect(wrapper.findAll('li')[0]!.attributes('aria-selected')).toBe('true')

      await input.trigger('keydown', { key: 'ArrowUp' })
      expect(wrapper.findAll('li')[2]!.attributes('aria-selected')).toBe('true')
    })

    it('Enter selects the active option', async () => {
      const wrapper = mountInput(['BTC', 'ETH', 'SOL'])
      const input = wrapper.find('input')
      await input.setValue('')
      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('update:modelValue')).toEqual([['BTC']])
    })

    it('Escape closes the dropdown', async () => {
      const wrapper = mountInput()
      await wrapper.find('input').setValue('')
      expect(wrapper.find('ul').exists()).toBe(true)
      await wrapper.find('input').trigger('keydown', { key: 'Escape' })
      expect(wrapper.find('ul').exists()).toBe(false)
    })
  })

  it('resets the query and closes the dropdown after blur', async () => {
    vi.useFakeTimers()
    const wrapper = mountInput(['BTC', 'ETH'], 'BTC')
    const input = wrapper.find('input')
    await input.setValue('E')
    await input.trigger('blur')
    await vi.advanceTimersByTimeAsync(150)
    expect((input.element as HTMLInputElement).value).toBe('BTC')
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('exposes combobox ARIA state that tracks the dropdown', async () => {
    const wrapper = mountInput(['BTC', 'ETH'], 'BTC')
    const input = wrapper.find('input')
    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-expanded')).toBe('false')

    await input.setValue('')
    expect(input.attributes('aria-expanded')).toBe('true')
    expect(input.attributes('aria-controls')).toBe('coin-listbox')

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe('coin-option-0')
  })
})
