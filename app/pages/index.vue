<template>
  <div class="flex items-center justify-center min-h-dvh p-4">
    <div class="text-center space-y-8 max-w-2xl">
      <div>
        <h1 class="text-6xl font-extrabold tracking-wider mb-4">{{ $config.public.app.name }}</h1>
        <p class="text-gray-400 text-sm font-semibold lowercase">{{ $config.public.app.description }}</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <UButton
          to="/login"
          size="lg"
          color="neutral"
          variant="outline"
          label="Admin Login"
          class="font-bold"
          icon="heroicons:arrow-right-on-rectangle"
        />
        <UButton
          to="https://github.com/noaione/filearr"
          target="_blank"
          size="lg"
          color="neutral"
          variant="ghost"
          class="font-bold"
          label="GitHub"
          icon="simple-icons:github"
        />
      </div>

      <div class="text-xs text-gray-600 mt-8">
        <p>v{{ $config.public.app.version }}</p>
        <p class="mt-0.5">by noaione</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const config = useRuntimeConfig()

useSeoMeta({
  title: 'filearr',
  description: 'stupidly simple file sharing server',
  ogTitle: 'filearr',
  ogDescription: 'stupidly simple file sharing server',
  ogUrl: config.public.siteUrl,
  ogImage: `${config.public.siteUrl}/assets/favicons/android-chrome-512x512.png`,
  ogType: 'website',
  twitterTitle: 'filearr',
  twitterDescription: 'stupidly simple file sharing server',
  twitterImage: `${config.public.siteUrl}/assets/favicons/android-chrome-512x512.png`,
  twitterCard: 'summary'
})

useHead({
  htmlAttrs: {
    lang: 'en',
  },
})
</script>
