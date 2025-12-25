import { defineStore } from 'pinia'

interface User {
  id: string
  username: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isLoggedIn: false,
    loading: false,
  }),

  actions: {
    async checkAuth() {
      try {
        this.loading = true
        const data = await $fetch('/api/auth/me')
        if (data.isLoggedIn) {
          // @ts-expect-error
          this.user = data.user!
          this.isLoggedIn = true
        } else {
          this.user = null
          this.isLoggedIn = false
        }
      } catch (error) {
        this.user = null
        this.isLoggedIn = false
      } finally {
        this.loading = false
      }
    },

    async login(username: string, password: string) {
      try {
        const data = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { username, password },
        })
        this.user = data.user
        this.isLoggedIn = true
        return { success: true }
      } catch (error: any) {
        return {
          success: false,
          error: error.data?.message || 'Login failed',
        }
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
        this.user = null
        this.isLoggedIn = false
      } catch (error) {
        // Logout anyway on error
        this.user = null
        this.isLoggedIn = false
      }
    },
  },
})
