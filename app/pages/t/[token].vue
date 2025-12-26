<template>
  <div v-if="!firstLoad" class="min-h-screen flex items-center justify-center p-4">
    <!-- Password Prompt -->
    <UCard v-if="!verified" class="w-full max-w-md bg-gray-950 border border-gray-800">
      <template #header>
        <div class="text-center">
          <h2 v-if="!error" class="text-2xl font-extrabold tracking-wide">{{ shareName || 'Shared File' }}</h2>
          <h2 v-else class="text-2xl font-extrabold tracking-wide">Error</h2>
          <p v-if="!error" class="text-gray-500 text-sm mt-1">{{ passwordProtected ? 'Enter password to access' : 'Ready to download' }}</p>
        </div>
      </template>

      <form v-if="passwordProtected" @submit.prevent="handleVerify" class="space-y-4">
        <UFormField label="Password" required>
          <UInput v-model="password" type="password" class="w-full" placeholder="••••••••" autofocus :disabled="loading" />
        </UFormField>
        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
        <UButton type="submit" block size="lg" class="cursor-pointer" :loading="loading" :disabled="!password">
          Access File
        </UButton>
      </form>

      <div v-else class="space-y-4">
        <div class="text-center py-4">
          <UIcon v-if="!error" name="i-heroicons-document" class="text-6xl text-blue-500 mx-auto mb-4" />
          <UIcon v-if="error" name="i-fluent:document-split-hint-off-24-regular" class="text-6xl text-red-500 mx-auto mb-4" />
          <p v-if="filePath" class="text-gray-400 text-sm font-mono">{{ filePath }}</p>
          <div v-if="error" class="text-red-400 font-bold text-sm">{{ error }}</div>
        </div>
        <UButton v-if="!error" @click="downloadFile" block size="lg" class="cursor-pointer" :loading="downloading" icon="i-heroicons-arrow-down-tray">
          Download File
        </UButton>
      </div>
    </UCard>

    <!-- File Download -->
    <UCard v-else class="w-full max-w-md bg-gray-950 border border-gray-800">
      <template #header>
        <div class="text-center">
          <h2 class="text-2xl font-extrabold tracking-wide">{{ shareName }}</h2>
          <p class="text-gray-500 text-sm mt-1">File ready to download</p>
        </div>
      </template>

      <div class="space-y-4">
        <div class="text-center py-4">
          <UIcon name="i-heroicons-document-check" class="text-6xl text-green-500 mx-auto mb-4" />
          <p class="text-gray-400 text-sm font-bold tracking-wide font-mono">{{ filePath }}</p>
          <p class="text-gray-400 text-sm font-semibold tracking-wide mt-0.5 font-mono">{{ formatSize(fileSize) }}</p>
        </div>

        <div v-if="expiresAt" class="text-xs text-gray-500 font-semibold tracking-wide text-center">
          Expires {{ formatDate(expiresAt) }}
        </div>

        <UButton @click="downloadFile" block size="lg" class="cursor-pointer" :loading="downloading" icon="i-heroicons-arrow-down-tray">
          Download File
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const toast = useToast()
const token = route.params.token as string

const firstLoad = ref(true)
const verified = ref(false)
const password = ref('')
const loading = ref(false)
const downloading = ref(false)
const error = ref('')

const shareName = ref('')
const filePath = ref('')
const fileSize = ref(0)
const passwordProtected = ref(false)
const expiresAt = ref<string | null>(null)

// Load share info
onMounted(async () => {
  try {
    const data = await $fetch<{
      name: string
      path: string
      passwordProtected: boolean
      expiresAt: string | null
      isAuthenticated: boolean
      size: number | null
    }>(`/api/file-share/${token}/info`)
    shareName.value = data.name
    filePath.value = data.path
    passwordProtected.value = data.passwordProtected
    expiresAt.value = data.expiresAt
    verified.value = data.isAuthenticated || !data.passwordProtected
    fileSize.value = data.size || 0
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.message || 'Failed to load share',
      color: 'error'
    })
    error.value = err.data?.message || 'Failed to load share'
  } finally {
    firstLoad.value = false
  }
})

// Handle password verification
const handleVerify = async () => {
  loading.value = true
  error.value = ''

  try {
    await $fetch(`/api/file-share/${token}/verify`, {
      method: 'POST',
      body: { password: password.value }
    })
    verified.value = true
    error.value = ''
  } catch (err: any) {
    error.value = err.data?.message || 'Invalid password'
  } finally {
    loading.value = false
  }
}

// Download file
const downloadFile = async () => {
  downloading.value = true
  
  try {
    // Get signature
    const signData = await $fetch<{
      signature: string
      expiry: number
      path: string
    }>(`/api/file-share/${token}/sign`, {
      method: 'POST'
    })

    // Download file
    const downloadUrl = `/api/file-share/${token}/download?sig=${signData.signature}&exp=${signData.expiry}`
    window.location.href = downloadUrl

    toast.add({
      title: 'Success',
      description: 'Download started',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.message || 'Failed to download file',
      color: 'error'
    })
  } finally {
    downloading.value = false
  }
}

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

useSeoMeta({
  title: `filearr - ${shareName.value || 'Shared File'}`,
  ogTitle: `filearr - ${shareName.value || 'Shared File'}`,
  description: 'Download shared file',
  ogDescription: 'Download shared file',
})
</script>
