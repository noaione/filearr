// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxt/ui', '@nuxt/hints', '@pinia/nuxt', '@nuxt/icon'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'filearr',
      meta: [
        { name: 'description', content: 'Simple file sharing server' }
      ]
    }
  },
  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production-please-really-long-secret',
    filesDirectory: process.env.FILES_DIRECTORY || './files',
    public: {
      appName: 'filearr'
    }
  },
  nitro: {
    preset: 'bun',
  }
})