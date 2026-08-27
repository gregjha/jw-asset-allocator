<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  id: string;
  label: string;
  modelValue: string;
  options: string[];
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const query = ref(props.modelValue);
const isOpen = ref(false);
const activeIndex = ref(-1);

const listboxId = computed(() => `${props.id}-listbox`);
function optionId(index: number) {
  return `${props.id}-option-${index}`;
}
const activeOptionId = computed(() => (activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined));
const filteredOptions = computed(() => {
  const q = query.value.trim().toUpperCase();
  const matches = q ? props.options.filter((option) => option.includes(q)) : props.options;
  return matches.slice(0, 5);
});

watch(() => props.modelValue, (value) => {
  query.value = value;
});

function openDropdown() {
  isOpen.value = true;
  activeIndex.value = -1;
}

function closeDropdown() {
  isOpen.value = false;
  activeIndex.value = -1;
}

function selectOption(option: string) {
  emit('update:modelValue', option);
  query.value = option;
  closeDropdown();
}

function handleFocus(event: FocusEvent) {
  (event.target as HTMLInputElement).select();
}

function handleBlur() {
  setTimeout(() => {
    closeDropdown();
    query.value = props.modelValue;
  }, 150);
}

function moveActive(delta: number) {
  if (!isOpen.value) {
    openDropdown();
    return;
  }
  const count = filteredOptions.value.length;
  if (!count) return;
  activeIndex.value = (activeIndex.value + delta + count) % count;
}

function selectActive() {
  const active = filteredOptions.value[activeIndex.value];
  if (active) selectOption(active);
}
</script>

<template>
  <div class="coin-autocomplete">
    <label class="field-label" :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model="query"
      type="text"
      class="text-input"
      autocomplete="off"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      :aria-activedescendant="activeOptionId"
      @focus="handleFocus"
      @input="openDropdown"
      @blur="handleBlur"
      @keydown.down.prevent="moveActive(1)"
      @keydown.up.prevent="moveActive(-1)"
      @keydown.enter.prevent="selectActive"
      @keydown.esc="closeDropdown"
    />

    <ul v-if="isOpen && filteredOptions.length" :id="listboxId" role="listbox" class="coin-autocomplete__list">
      <li
        v-for="(option, index) in filteredOptions"
        :id="optionId(index)"
        :key="option"
        role="option"
        :aria-selected="index === activeIndex"
        class="coin-autocomplete__option"
        :class="{ 'coin-autocomplete__option--active': index === activeIndex }"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option }}
      </li>
    </ul>
    <p v-else-if="isOpen" class="coin-autocomplete__empty" aria-live="polite" role="status">No matches</p>
  </div>
</template>

<style scoped>
.coin-autocomplete {
  position: relative;
  text-align: left;
}

.coin-autocomplete__list {
  position: absolute;
  z-index: 10;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  max-height: 12rem;
  overflow-y: auto;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  background: var(--color-surface);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgb(var(--jw-navy-rgb) / 0.12);
}

.coin-autocomplete__option {
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  cursor: pointer;
}

.coin-autocomplete__option:hover,
.coin-autocomplete__option--active {
  background: var(--jw-blue-light);
}

.coin-autocomplete__empty {
  position: absolute;
  z-index: 10;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.5rem 0.625rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-md);
}
</style>
