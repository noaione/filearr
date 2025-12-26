import packageJson from './package.json'

const signatureExpiry = Number.parseInt(process.env.SIGNATURE_EXPIRY || '3600', 10) || 3600;

if (signatureExpiry < 1) {
  throw new Error('Signature expiry is not valid!');
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  modules: ['@nuxt/ui', '@nuxt/hints', '@pinia/nuxt', '@nuxt/icon', '@nuxt/fonts', "nuxt-og-image"],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
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
          name: "msapplication-TileColor",
          content: "#51A2FF",
        },
        {
          name: "msapplication-TileImage",
          content: "/assets/favicons/ms-icon-144x144.png",
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
        // {
        //   rel: "apple-touch-icon",
        //   sizes: "180x180",
        //   href: "/assets/favicons/apple-touch-icon.png",
        // },
        // {
        //   rel: "icon",
        //   type: "image/png",
        //   sizes: "512x512",
        //   href: "/assets/favicons/android-chrome-512x512.png",
        // },
        // {
        //   rel: "icon",
        //   type: "image/png",
        //   sizes: "192x192",
        //   href: "/assets/favicons/android-chrome-192x192.png",
        // },
        // {
        //   rel: "icon",
        //   type: "image/png",
        //   sizes: "96x96",
        //   href: "/assets/favicons/android-chrome-96x96.png",
        // },
        // {
        //   rel: "icon",
        //   type: "image/png",
        //   sizes: "32x32",
        //   href: "/assets/favicons/favicon-32x32.png",
        // },
        // {
        //   rel: "icon",
        //   type: "image/png",
        //   sizes: "16x16",
        //   href: "/assets/favicons/favicon-16x16.png",
        // },
        // {
        //   rel: "icon",
        //   type: "image/png",
        //   href: "/assets/favicons/android-chrome-192x192.png",
        // },
        // {
        //   rel: "manifest",
        //   href: "/site.webmanifest",
        // },
        // {
        //   rel: "mask-icon",
        //   href: "/assets/favicons/safari-pinned-tab.svg",
        //   color: "#fd8455",
        // },
      ],
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
  },
  ogImage: {
    satoriOptions: {
      debug: true,
      embedFont: true,
    },
    fonts: [
      'JetBrains Mono:400',
      'JetBrains Mono:600',
      'JetBrains Mono:700',
      'JetBrains Mono:800',
    ]
  }
})