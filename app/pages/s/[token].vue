<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <!-- Password Prompt -->
    <UCard v-if="!verified" class="w-full max-w-md bg-gray-950 border border-gray-800">
      <template #header>
        <div class="text-center">
          <h2 class="text-2xl font-bold tracking-wider">{{ shareName || 'Shared Folder' }}</h2>
          <p class="text-gray-500 text-sm mt-1">Enter password to access</p>
        </div>
      </template>

      <form @submit.prevent="handleVerify" class="space-y-4">
        <UFormGroup label="Password" required>
          <UInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            autofocus
            :disabled="loading"
          />
        </UFormGroup>

        <div v-if="error" class="text-red-500 text-sm">
          {{ error }}
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
          :disabled="!password"
        >
          Access
        </UButton>
      </form>
    </UCard>

    <!-- File Browser -->
    <div v-else class="w-full max-w-4xl">
      <UCard class="bg-gray-950 border border-gray-800">
        <template #header>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h2 class="text-2xl font-bold tracking-wider">{{ shareName }}</h2>
              <UButton
                v-if="currentPath"
                @click="navigateUp"
                variant="ghost"
                size="sm"
                icon="i-heroicons-arrow-up"
              >
                Up
              </UButton>
            </div>
            <p class="text-gray-500 text-sm font-mono">{{ currentPath || '/' }}</p>
          </div>
        </template>

        <div class="space-y-2">
          <div v-if="browseLoading" class="text-center py-12 text-gray-500">
            Loading...
          </div>

          <div v-else-if="items.length === 0" class="text-center py-12 text-gray-500">
            This folder is empty
          </div>

          <div v-else class="space-y-1">
            <div
              v-for="item in items"
              :key="item.path"
              class="flex items-center justify-between p-3 hover:bg-gray-800 rounded border border-gray-800 transition-colors"
            >
              <button
                v-if="item.isDirectory"
                @click="navigateToFolder(item.path)"
                class="flex items-center gap-3 flex-1 text-left"
              >
                <UIcon name="i-heroicons-folder" class="text-yellow-500 text-xl" />
                <span class="font-mono">{{ item.name }}</span>
              </button>

              <div v-else class="flex items-center gap-3 flex-1">
                <UIcon name="i-heroicons-document" class="text-gray-500 text-xl" />
                <span class="font-mono">{{ item.name }}</span>
                <span class="text-gray-600 text-xs ml-auto">{{ formatSize(item.size) }}</span>
              </div>

              <UButton
                v-if="item.isFile"
                @click="downloadFile(item.path)"
                variant="outline"
                size="sm"
                icon="i-heroicons-arrow-down-tray"
              >
                Download
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const toast = useToast()

const token = route.params.token as string

const verified = ref(false)
const shareName = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const currentPath = ref('')
const items = ref<any[]>([])
const browseLoading = ref(false)

// Try to verify without password first
onMounted(async () => {
  try {
    const data = await $fetch(`/api/share/${token}/verify`, {
      method: 'POST',
      body: {}
    })
    shareName.value = data.name
    if (!data.hasPassword) {
      verified.value = true
      loadFolder('')
    }
  } catch (err: any) {
    if (err.statusCode !== 401) {
      error.value = err.data?.message || 'Failed to access share'
    }
  }
})

const handleVerify = async () => {
  loading.value = true
  error.value = ''

  try {
    const data = await $fetch(`/api/share/${token}/verify`, {
      method: 'POST',
      body: { password: password.value }
    })
    shareName.value = data.name
    verified.value = true
    loadFolder('')
  } catch (err: any) {
    error.value = err.data?.message || 'Invalid password'
  } finally {
    loading.value = false
  }
}

const loadFolder = async (path: string) => {
  browseLoading.value = true
  try {
    const data = await $fetch(`/api/share/${token}/browse?path=${encodeURIComponent(path)}`)
    currentPath.value = data.currentPath
    items.value = data.items
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.message || 'Failed to load folder',
      color: 'error'
    })
  } finally {
    browseLoading.value = false
  }
}

const navigateToFolder = (path: string) => {
  loadFolder(path)
}

const navigateUp = () => {
  const parts = currentPath.value.split('/').filter(Boolean)
  parts.pop()
  loadFolder(parts.join('/'))
}

const downloadFile = async (filePath: string) => {
  try {
    // Sign the file path
    const signature = await $fetch(`/api/share/${token}/sign`, {
      method: 'POST',
      body: { path: filePath }
    })

    // Create download URL
    const url = `/api/share/${token}/download?path=${encodeURIComponent(filePath)}&sig=${signature}`
    
    // Trigger download
    window.open(url, '_blank')
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.message || 'Failed to download file',
      color: 'error'
    })
  }
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>
