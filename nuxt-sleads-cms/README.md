# Sleads CMS for Nuxt 4

Drop-in Sleads CMS integration for Nuxt 4. Mirrors the Next.js `useSleadsCMS` API 1:1: same composable surface, cache keys, and API behavior.

## Setup

1. Copy the contents of this folder into your Nuxt 4 project:
   - `types.ts` → project root (so that `composables/` and `components/` can import from `../types`), or put it elsewhere and update the import paths in the composables and the provider
   - `composables/` → your project’s `composables/`
   - `components/` → your project’s `components/`

   Or add this repo as a local dependency and re-export the composables and component from your app.

2. **Runtime config**

   In `nuxt.config.ts`:

   ```ts
   export default defineNuxtConfig({
     runtimeConfig: {
       public: {
         sleadsCmsApiKey: '',
       },
     },
   })
   ```

3. **Environment**

   Set the API key via env (BE AWARE! This key should never be used anywhere outside of the development environment):

   ```bash
   NUXT_PUBLIC_SLEADS_CMS_API_KEY=your-api-key
   ```

   Nuxt maps `NUXT_PUBLIC_*` to `runtimeConfig.public.*`, so this becomes `runtimeConfig.public.sleadsCmsApiKey`.

4. **Mount the provider**

   Wrap the app (or the part that uses CMS) with `SleadsCMSLanguageProvider` so language state is shared.

   **Option A – whole app**  
   In `app.vue`:

   ```vue
   <template>
     <SleadsCMSLanguageProvider>
       <NuxtPage />
     </SleadsCMSLanguageProvider>
   </template>
   ```

   **Option B – CMS-only layout**  
   In a layout used only by CMS pages, wrap that layout’s content with `<SleadsCMSLanguageProvider>`.

## Usage

- **`useSleadsCMS(overridePathname?)`**  
  Use in any page/component under the provider. Returns:

  - `c(id, defaultValue)` – get CMS value for field `id`, fallback `defaultValue`
  - `getRegisterStatus()` – check if listening mode is on (localhost)
  - `showFieldsAlert()` – debug: list current field ids
  - `languages`, `selectedLanguage`, `isLoadingLanguages`, `setLanguage` – language state and setter

- **`useSleadsCMSLanguage()`**  
  Use when you only need language state (e.g. a language switcher). Must be used inside `SleadsCMSLanguageProvider`.

- **`<LanguageSelector />`**  
  Dropdown component that shows the current language (name + flag), opens a list of all available languages (with metadata: name, flag, code), and calls `setLanguage` on choice. Use it anywhere inside `SleadsCMSLanguageProvider`. Uses the same Tailwind-style classes as the Next.js version (loading spinner, click-outside to close). No extra icon dependency (inline SVGs).

Example:

```vue
<script setup lang="ts">
const { c, languages, selectedLanguage, setLanguage } = useSleadsCMS()
</script>

<template>
  <LanguageSelector />
  <h1>{{ c('hero_title', 'Welcome') }}</h1>
  <select :value="selectedLanguage" @change="setLanguage(($event.target as HTMLSelectElement).value)">
    <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
  </select>
</template>
```

## Parity with Next.js

- Same cache keys and 30-day expiry; same Convex/API endpoints and request shapes.
- `c(id, defaultValue)` returns `defaultValue` on first paint, then CMS value when loaded; respects `selectedLanguage` and `splitId` query param.
- `setLanguage(lang)` updates all consumers and persists to `localStorage` under `selectedLanguage`.
- Listening mode (localhost + `sleadsCmsApiKey`) triggers one registration request; `getRegisterStatus` and `showFieldsAlert` behave as in the Next version.
