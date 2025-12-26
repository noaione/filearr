import { defineStore } from 'pinia'

interface SharedFolder {
  id: string
  name: string
  path: string
  shareToken: string
  password: string | null
  expiresAt: string | null
  createdAt: string
  downloadCount: number
}

interface SharedFile {
  id: string
  name: string
  path: string
  shareToken: string
  password: string | null
  expiresAt: string | null
  createdAt: string
  downloadCount: number
}

export const useSharesStore = defineStore('shares', {
  state: () => ({
    shares: [] as SharedFolder[],
    fileShares: [] as SharedFile[],
    loading: false,
  }),

  actions: {
    async fetchShares() {
      try {
        this.loading = true
        this.shares = await $fetch('/api/admin/shares')
      } catch (error) {
        console.error('Failed to fetch shares:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchFileShares() {
      try {
        this.loading = true
        this.fileShares = await $fetch('/api/admin/file-shares')
      } catch (error) {
        console.error('Failed to fetch file shares:', error)
      } finally {
        this.loading = false
      }
    },

    async createShare(data: {
      name: string
      path: string
      password?: string
      expiresAt?: string
    }) {
      try {
        const share = await $fetch('/api/admin/shares', {
          method: 'POST',
          body: data,
        })
        this.shares.unshift(share as any)
        return { success: true, share }
      } catch (error: any) {
        return {
          success: false,
          error: error.data?.message || 'Failed to create share',
        }
      }
    },

    async createFileShare(data: {
      name: string
      path: string
      password?: string
      expiresAt?: string
    }) {
      try {
        const share = await $fetch('/api/admin/file-shares', {
          method: 'POST',
          body: data,
        })
        this.fileShares.unshift(share as any)
        return { success: true, share }
      } catch (error: any) {
        return {
          success: false,
          error: error.data?.message || 'Failed to create file share',
        }
      }
    },

    async deleteShare(id: string) {
      try {
        await $fetch(`/api/admin/shares/${id}`, {
          method: 'DELETE',
        })
        this.shares = this.shares.filter(s => s.id !== id)
        return { success: true }
      } catch (error: any) {
        return {
          success: false,
          error: error.data?.message || 'Failed to delete share',
        }
      }
    },

    async deleteFileShare(id: string) {
      try {
        await $fetch(`/api/admin/file-shares/${id}`, {
          method: 'DELETE',
        })
        this.fileShares = this.fileShares.filter(s => s.id !== id)
        return { success: true }
      } catch (error: any) {
        return {
          success: false,
          error: error.data?.message || 'Failed to delete file share',
        }
      }
    },

    getShareUrl(token: string) {
      if (typeof window !== 'undefined') {
        return `${window.location.origin}/s/${token}`
      }
      return `/s/${token}`
    },

    getFileShareUrl(token: string) {
      if (typeof window !== 'undefined') {
        return `${window.location.origin}/t/${token}`
      }
      return `/t/${token}`
    },
  },
})
