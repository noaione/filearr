<template>
  <div class="min-w-96 min-h-52 font-mono-simple h-full w-full flex items-start justify-start bg-gray-900 text-white">
    <div class="flex w-full h-full">
      <div class="flex flex-col w-full h-full p-10 justify-start items-start">
        <h1 class="text-4xl font-extrabold text-left font-mono-simple"> {{ $config.public.app.name }} </h1>
        <p class="font-semibold text-gray-400 mt-4 font-mono-simple"> {{ $config.public.app.description }} </p>
        <div class="mt-auto flex flex-row w-full justify-between items-end gap-16">
          <div class="flex flex-col items-start text-left">
            <div v-if="passwordProtected" class="mb-1 flex flex-row items-center text-amber-300 gap-2">
              <!-- Icon from HeroIcons by Refactoring UI Inc - https://github.com/tailwindlabs/heroicons/blob/master/LICENSE -->
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25" />
              </svg>
              <span class="text-sm font-bold tracking-wide font-mono-simple">Protected</span>
            </div>
            <p class="font-extrabold text-gray-200 wrap-break-word tracking-tight font-mono-simple">{{ name }}</p>
            <p v-if="token" class="font-bold text-gray-400 mt-1 text-sm tracking-wide font-mono-simple">{{ token }}</p>
          </div>
          <p class="font-bold text-gray-400 text-sm tracking-wide font-mono-simple">v{{ $config.public.app.version }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  name?: string
  token?: string
  passwordProtected?: boolean
}>(), {
  name: 'Shared Folder',
  passwordProtected: false
})
</script>

<style scoped>
.font-mono-simple {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace;
}
</style>