import packageJson from './package.json'

const signatureExpiry = Number.parseInt(process.env.SIGNATURE_EXPIRY || '3600', 10) || 3600;
const maxBulkSizeBytes = Number.parseInt(process.env.MAX_BULK_SIZE_BYTES || '1073741824', 10) || 1073741824;

if (signatureExpiry < 1) {
  throw new Error('Signature expiry is not valid!');
}

if (maxBulkSizeBytes < 1) {
  throw new Error('Max bulk size bytes is not valid!');
}

// if it's bigger than 2gb, we warn the user
if (maxBulkSizeBytes > 2147483648) {
  console.warn('Warning: MAX_BULK_SIZE_BYTES is set to more than 2GB, which may cause performance issues.');
}

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not set!');
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  modules: ['@nuxt/ui', '@nuxt/hints', '@pinia/nuxt', '@nuxt/icon', '@nuxt/fonts'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      title: packageJson.name,
      meta: [
        {
          "http-equiv": "x-ua-compatible",
          content: "IE=edge",
        },
        {
          name: "apple-mobile-web-app-title",
          content: packageJson.name,
        },
        {
          name: "apple-mobile-web-app-capable",
          content: "yes",
        },
        {
          name: "mobile-web-app-capable",
          content: "yes",
        },
        {
          name: "application-name",
          content: packageJson.name,
        },
        {
          name: "theme-color",
          content: "#51A2FF",
        },
        { name: 'description', content: packageJson.description },
      ],
      link: [
        {
          rel: "shortcut icon",
          href: "/favicon.ico",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/assets/favicons/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          href: "/assets/favicons/base.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "512x512",
          href: "/assets/favicons/android-chrome-512x512.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "192x192",
          href: "/assets/favicons/android-chrome-192x192.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "96x96",
          href: "/assets/favicons/android-chrome-96x96.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/assets/favicons/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/assets/favicons/favicon-16x16.png",
        },
        {
          rel: "icon",
          type: "image/png",
          href: "/assets/favicons/android-chrome-192x192.png",
        },
        {
          rel: "manifest",
          href: "/site.webmanifest",
        },
      ],
    }
  },
  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET!,
    filesDirectory: process.env.FILES_DIRECTORY || './files',
    signatureExpiry,
    maxBulkSizeBytes,
    public: {
      app: {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
      },
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
    }
  },
  nitro: {
    preset: 'bun',
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      '0 0 * * *': ['db:cleanup']
    }
  },
  fonts: {
    defaults: {
      weights: [300, 400, 500, 600, 700, 800],
      styles: ['normal', 'italic'],
    }
  },
  icon: {
    mode: 'svg',
    provider: 'none',
    serverBundle: false,
    clientBundle: {
      scan: {
        // note that when you specify those values, the default behavior will be overridden
        globInclude: ['app/components/**/*.vue', 'app/pages/**/*.vue'],
        globExclude: ['node_modules', 'dist', /* ... */],
      },
      sizeLimitKb: 20
    }
  }
})