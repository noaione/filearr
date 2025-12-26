<template>
  <div v-if="!firstLoad" class="min-h-screen flex justify-center p-4 w-full" :class="{
    'items-center': !verified || viewThisFile,
    'flex-col h-screen': verified,
  }">
    <!-- Password Prompt -->
    <UCard v-if="!verified" class="w-full max-w-md bg-gray-950 border border-gray-800">
      <template #header>
        <div class="text-center">
          <h2 class="text-2xl font-extrabold tracking-wide">{{ shareName || 'Shared Folder' }}</h2>
          <p class="text-gray-500 text-sm mt-1">Enter password to access</p>
        </div>
      </template>
      <form @submit.prevent="handleVerify" class="space-y-4">
        <UFormField label="Password" required>
          <UInput v-model="password" type="password" class="w-full" placeholder="••••••••" autofocus :disabled="loading" />
        </UFormField>
        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
        <UButton type="submit" block size="lg" class="cursor-pointer" :loading="loading" :disabled="!password"> Access </UButton>
      </form>
    </UCard>
    <!-- File Browser -->
    <div v-else-if="!viewThisFile" class="w-full flex flex-col h-full overflow-hidden">
      <!-- Fixed Header -->
      <div class="bg-gray-950 border border-gray-800 rounded-t-lg p-4 sm:p-6 shrink-0">
        <div class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <h2 class="text-xl sm:text-2xl font-bold tracking-wider truncate">{{ shareName }}</h2>
            <div class="flex items-center gap-2">
              <UButton
                v-if="currentPath"
                @click="navigateUp"
                variant="ghost"
                size="sm"
                color="neutral"
                icon="i-heroicons-arrow-up"
                class="shrink-0 cursor-pointer"
              >
                <span class="hidden sm:inline">Up</span>
              </UButton>
              <UButton
                @click="toggleSelectionMode"
                variant="ghost"
                size="sm"
                :color="selectionMode ? 'primary' : 'neutral'"
                :icon="selectionMode ? 'i-heroicons-check-circle' : 'i-heroicons-cursor-arrow-rays'"
                class="shrink-0 cursor-pointer"
              >
                <span class="hidden sm:inline">{{ selectionMode ? 'Cancel' : 'Select' }}</span>
              </UButton>
              <UButton
                v-if="selectionMode && selectedFiles.size > 0"
                @click="downloadSelectedFiles"
                variant="solid"
                size="sm"
                class="tracking-wide font-extrabold cursor-pointer shrink-0 text-xs sm:text-sm"
                icon="i-heroicons-arrow-down-tray"
                :loading="downloadingSelected"
              >
                <span class="hidden sm:inline">Download ({{ selectedFiles.size }})</span>
                <span class="sm:hidden">({{ selectedFiles.size }})</span>
              </UButton>
              <UButton
                v-if="!selectionMode && !browseLoading && fileCount > 0"
                @click="downloadAllFiles"
                variant="outline"
                size="sm"
                class="tracking-wide font-extrabold cursor-pointer shrink-0 text-xs sm:text-sm"
                icon="i-heroicons-archive-box-arrow-down"
                :loading="downloadingAll"
              >
                <span class="hidden sm:inline">Download All ({{ fileCount }})</span>
                <span class="sm:hidden">All ({{ fileCount }})</span>
              </UButton>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <p class="text-gray-500 text-xs sm:text-sm font-mono truncate">{{ `/${currentPath}` }}</p>
            <label class="flex items-center gap-2 mt-2 sm:mt-0 text-xs sm:text-sm text-gray-400 font-semibold cursor-pointer shrink-0">
              <input
                v-model="showHidden"
                type="checkbox"
                class="rounded bg-gray-800 border-gray-700 text-white focus:ring-white focus:ring-offset-gray-950"
                @change="loadFolder(currentPath)"
              />
              <span class="hidden sm:inline">Show hidden files</span>
              <span class="sm:hidden">Hidden</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="bg-gray-950 border-x border-b border-gray-800 rounded-b-lg p-4 sm:p-6 flex-1 overflow-auto">
        <div class="space-y-2">
          <div v-if="browseLoading" class="text-center py-12 text-gray-500">Loading...</div>
          <div v-else-if="items.length === 0">
            <FileRow v-if="currentPath" :item="SPECIAL_ACTION" @navigate="navigateUp" />
            <div class="text-center py-12 text-gray-500">This folder is empty</div>
          </div>
          <div v-else-if="items.length === 0" class="text-center py-12 text-gray-500">This folder is empty</div>
          <div v-else class="space-y-1">
            <FileRow v-if="currentPath" :item="SPECIAL_ACTION" @navigate="navigateUp" />
            <FileRow 
              v-for="item in items" 
              :key="item.path" 
              :item="item" 
              :selection-mode="selectionMode"
              :is-selected="selectedFiles.has(item.path)"
              @navigate="navigateToFolder" 
              @download="downloadFile"
              @toggle-select="toggleFileSelection"
              @view-file="viewFileInfo"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- File Detail View -->
    <FileInfo v-else-if="viewThisFile" :token="token" :item="viewThisFile" @download="downloadFile" @goBack="backToBrowse" />
  </div>
</template>
<script setup lang="ts">
import FileInfo from '~/components/FileInfo.vue'
import type { BrowseItem } from '~~/server/api/share/[token]/browse.get'

definePageMeta({
  layout: false
})

const route = useRoute()
const toast = useToast()

const token = route.params.token as string

const { data, error: errorAPI } = await useFetch(`/api/share/${token}/info`)

const firstLoad = ref(true)
const verified = ref(false)
const shareName = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const currentPath = ref('')
const items = ref<BrowseItem[]>([])
const browseLoading = ref(false)
const showHidden = ref(false)
const downloadingAll = ref(false)
const selectionMode = ref(false)
const selectedFiles = ref<Set<string>>(new Set())
const downloadingSelected = ref(false)
const viewThisFile = ref<BrowseItem | null>(null)

const fileCount = computed(() => items.value.filter(i => i.isFile).length)

const SPECIAL_ACTION: BrowseItem = {
  name: '..',
  isDirectory: true,
  isFile: false,
  path: '',
  size: 0,
  modified: ''
}

// Try to verify without password first
onMounted(async () => {
  if (!data.value && errorAPI.value) {
    toast.add({
      title: 'Error',
      description: errorAPI.value.data?.message || 'Failed to load share',
      color: 'error'
    })
    firstLoad.value = false
    error.value = 'Failed to load share'
    return
  }

  shareName.value = data.value?.name || 'Shared Folder'
  firstLoad.value = false

  verified.value = data.value?.isAuthenticated || false
  await nextTick()

  if (verified.value) {
    loadFolder('')
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
    const data = await $fetch(`/api/share/${token}/browse?path=${encodeURIComponent(path)}&showHidden=${showHidden.value}`)
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

  useSeoMeta({
    title: `${shareName.value} - /${currentPath.value}`,
    ogTitle: 'filearr',
    description: 'stupidly simple file sharing',
    ogDescription: `viewing: /${currentPath.value}`,
  })
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
    const url = `/api/share/${token}/download?path=${encodeURIComponent(filePath)}&sig=${signature.sig}&exp=${signature.exp}`

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

const downloadAllFiles = async () => {
  downloadingAll.value = true
  try {
    const signature = await $fetch(`/api/share/${token}/sign`, {
      method: 'POST',
      body: { path: currentPath.value, bulk: true }
    })

    const url = `/api/share/${token}/download-all?path=${encodeURIComponent(currentPath.value)}&sig=${signature.sig}&exp=${signature.exp}`
    window.open(url, '_blank')
    toast.add({
      title: 'Download Started',
      description: `Downloading ${fileCount.value} files as ZIP`,
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.message || 'Failed to download files',
      color: 'error'
    })
  } finally {
    downloadingAll.value = false
  }
}

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    selectedFiles.value.clear()
  }
}

const toggleFileSelection = (path: string) => {
  if (selectedFiles.value.has(path)) {
    selectedFiles.value.delete(path)
  } else {
    selectedFiles.value.add(path)
  }
}

const downloadSelectedFiles = async () => {
  if (selectedFiles.value.size === 0) return

  downloadingSelected.value = true
  try {
    const paths = Array.from(selectedFiles.value)
    const signature = await $fetch(`/api/share/${token}/sign`, {
      method: 'POST',
      body: { paths, bulk: true }
    })

    const url = `/api/share/${token}/download-selected?sig=${signature.sig}&exp=${signature.exp}`
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = url
    form.style.display = 'none'

    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'paths'
    input.value = JSON.stringify(paths)
    form.appendChild(input)

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)

    toast.add({
      title: 'Download Started',
      description: `Downloading ${selectedFiles.value.size} selected files as ZIP`,
      color: 'success'
    })

    // Exit selection mode and clear selections
    selectionMode.value = false
    selectedFiles.value.clear()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.message || 'Failed to download selected files',
      color: 'error'
    })
  } finally {
    downloadingSelected.value = false
  }
}

const viewFileInfo = (item: BrowseItem) => {
  viewThisFile.value = item
}

const backToBrowse = () => {
  viewThisFile.value = null
}

useSeoMeta({
  title: `${data.value?.name || 'Shared Folder'} - /${currentPath.value}`,
  ogTitle: 'filearr',
  description: 'stupidly simple file sharing',
  ogDescription: 'stupidly simple file sharing',
})
</script>
