import packageJson from './package.json'

const signatureExpiry = Number.parseInt(process.env.SIGNATURE_EXPIRY || '3600', 10) || 3600;

if (signatureExpiry < 1) {
  throw new Error('Signature expiry is not valid!');
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxt/ui', '@nuxt/hints', '@pinia/nuxt', '@nuxt/icon', '@nuxt/fonts'],
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
    signatureExpiry,
    public: {
      app: {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
      },
    }
  },
  nitro: {
    preset: 'bun',
  },
  fonts: {
    defaults: {
      weights: [300, 400, 500, 600, 700, 800],
      styles: ['normal', 'italic'],
    }
  }
})