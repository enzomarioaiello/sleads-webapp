<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, unref } from 'vue'
import useSleadsCMS from '../composables/useSleadsCMS'

const LANGUAGE_METADATA: Record<string, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇬🇧' },
  zh: { name: 'Mandarin Chinese', flag: '🇨🇳' },
  hi: { name: 'Hindi', flag: '🇮🇳' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  ar: { name: 'Arabic', flag: '🇸🇦' },
  bn: { name: 'Bengali', flag: '🇧🇩' },
  pt: { name: 'Portuguese', flag: '🇵🇹' },
  ru: { name: 'Russian', flag: '🇷🇺' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  de: { name: 'German', flag: '🇩🇪' },
  ko: { name: 'Korean', flag: '🇰🇷' },
  vi: { name: 'Vietnamese', flag: '🇻🇳' },
  it: { name: 'Italian', flag: '🇮🇹' },
  tr: { name: 'Turkish', flag: '🇹🇷' },
  pl: { name: 'Polish', flag: '🇵🇱' },
  uk: { name: 'Ukrainian', flag: '🇺🇦' },
  nl: { name: 'Dutch', flag: '🇳🇱' },
  th: { name: 'Thai', flag: '🇹🇭' },
  id: { name: 'Indonesian', flag: '🇮🇩' },
  cs: { name: 'Czech', flag: '🇨🇿' },
  sv: { name: 'Swedish', flag: '🇸🇪' },
  ro: { name: 'Romanian', flag: '🇷🇴' },
  hu: { name: 'Hungarian', flag: '🇭🇺' },
  fi: { name: 'Finnish', flag: '🇫🇮' },
  da: { name: 'Danish', flag: '🇩🇰' },
  no: { name: 'Norwegian', flag: '🇳🇴' },
  he: { name: 'Hebrew', flag: '🇮🇱' },
  el: { name: 'Greek', flag: '🇬🇷' },
  sk: { name: 'Slovak', flag: '🇸🇰' },
}

const { languages, isLoadingLanguages, selectedLanguage, setLanguage } =
  useSleadsCMS()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    isOpen.value = false
  }
}

function setupClickOutside() {
  document.addEventListener('mousedown', handleClickOutside)
}
function teardownClickOutside() {
  document.removeEventListener('mousedown', handleClickOutside)
}

onMounted(() => {
  if (isOpen.value) setupClickOutside()
})

watch(isOpen, (open) => {
  if (open) {
    // Defer so the click that opened doesn't immediately close
    requestAnimationFrame(() => setupClickOutside())
  } else {
    teardownClickOutside()
  }
}, { immediate: true })

onUnmounted(teardownClickOutside)

const currentLang = computed(() => {
  const code = unref(selectedLanguage)
  return code ? LANGUAGE_METADATA[code] : null
})

const availableLanguages = computed(() =>
  unref(languages)
    .filter((code: string) => LANGUAGE_METADATA[code])
    .map((code: string) => ({
      code,
      ...LANGUAGE_METADATA[code],
    }))
    .sort((a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name),
    ),
)

function selectLanguage(code: string) {
  setLanguage(code)
  isOpen.value = false
}
</script>

<template>
  <!-- Loading -->
  <div
    v-if="isLoadingLanguages"
    class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-sleads-slate800 rounded-lg border border-gray-200 dark:border-sleads-slate700 shadow-sm"
  >
    <svg
      class="w-4 h-4 animate-spin text-gray-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span class="text-sm text-gray-500 dark:text-sleads-slate400">
      Loading languages...
    </span>
  </div>

  <!-- No languages -->
  <div
    v-else-if="availableLanguages.length === 0"
    class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-sleads-slate800 rounded-lg border border-gray-200 dark:border-sleads-slate700"
  >
    <svg
      class="w-4 h-4 text-gray-400"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
    <span class="text-sm text-gray-500 dark:text-sleads-slate400">
      No languages available
    </span>
  </div>

  <!-- Dropdown -->
  <div v-else ref="dropdownRef" class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-sleads-slate800 rounded-lg border transition-all shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md"
      :class="
        isOpen
          ? 'border-blue-500 dark:border-blue-400 shadow-md'
          : 'border-gray-200 dark:border-sleads-slate700'
      "
      aria-label="Select language"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="isOpen = !isOpen"
    >
      <template v-if="currentLang">
        <span class="text-lg">{{ currentLang.flag }}</span>
        <span class="text-sm font-medium text-gray-900 dark:text-white">
          {{ currentLang.name }}
        </span>
        <span class="text-xs text-gray-500 dark:text-sleads-slate400">
          ({{ selectedLanguage.toUpperCase() }})
        </span>
      </template>
      <svg
        class="w-4 h-4 text-gray-400 dark:text-sleads-slate500 transition-transform"
        :class="isOpen ? 'rotate-180' : ''"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute left-0 top-full z-50 mt-2 max-h-80 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-sleads-slate700 dark:bg-sleads-slate800"
    >
      <div class="p-2">
        <button
          v-for="lang in availableLanguages"
          :key="lang.code"
          type="button"
          role="option"
          :aria-selected="lang.code === selectedLanguage"
          class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all hover:bg-blue-50 dark:hover:bg-sleads-slate700"
          :class="
            lang.code === selectedLanguage
              ? 'border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-sleads-slate700'
              : ''
          "
          @click="selectLanguage(lang.code)"
        >
          <span class="text-xl">{{ lang.flag }}</span>
          <div class="min-w-0 flex-1">
            <p
              class="truncate text-sm font-medium"
              :class="
                lang.code === selectedLanguage
                  ? 'text-blue-900 dark:text-blue-100'
                  : 'text-gray-900 dark:text-white'
              "
            >
              {{ lang.name }}
            </p>
            <p
              class="truncate text-xs"
              :class="
                lang.code === selectedLanguage
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 dark:text-sleads-slate400'
              "
            >
              {{ lang.code.toUpperCase() }}
            </p>
          </div>
          <svg
            v-if="lang.code === selectedLanguage"
            class="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
