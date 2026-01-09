<template>
  <div v-if="!firstLoad" class="min-h-dvh flex justify-center p-4 w-full" :class="{
    'sm:items-center': !verified || viewThisFile,
    'flex-col': verified,
    'h-dvh': !viewThisFile
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
                @click="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'"
                variant="ghost"
                size="sm"
                color="neutral"
                :icon="sortDirection === 'asc' ? 'heroicons:arrow-up' : 'heroicons:arrow-down'"
                class="shrink-0 cursor-pointer"
              >
                <span class="hidden sm:inline">{{ sortDirection === 'asc' ? 'Ascending' : 'Descending' }}</span>
              </UButton>
              <UButton
                v-if="selectionMode && selectedFiles.size < fileCount"
                @click="doSelectAll"
                variant="ghost"
                size="sm"
                color="primary"
                icon="tabler:select-all"
                class="shrink-0 cursor-pointer"
              >
                <span class="hidden sm:inline">Select All</span>
              </UButton>
              <UButton
                v-if="selectionMode && selectedFiles.size > 0"
                @click="doDeselectAll"
                variant="ghost"
                size="sm"
                color="primary"
                icon="tabler:deselect"
                class="shrink-0 cursor-pointer"
              >
                <span class="hidden sm:inline">Deselect All</span>
              </UButton>
              <UButton
                @click="toggleSelectionMode"
                variant="ghost"
                size="sm"
                :color="selectionMode ? 'primary' : 'neutral'"
                :icon="selectionMode ? 'heroicons:check-circle' : 'heroicons:cursor-arrow-rays'"
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
                icon="heroicons:arrow-down-tray"
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
                icon="heroicons:archive-box-arrow-down"
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
            <FileRow v-if="currentPath" :item="SPECIAL_ACTION" @navigate="navigateUpSpecial" />
            <div class="text-center py-12 text-gray-500">This folder is empty</div>
          </div>
          <div v-else class="space-y-1">
            <FileRow v-if="currentPath" :item="SPECIAL_ACTION" @navigate="navigateUp" />
            <FileRow 
              v-for="item in sortedItems" 
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
import type { BrowseItem } from '~~/server/api/share/[token]/browse.get'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const path = route.query.path as string || ''
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
const lastSelectedIndex = ref<number | null>(null)
const viewThisFile = ref<BrowseItem | null>(null)
const failureFirstLoad = ref<boolean>(false)
const sortDirection = ref<'asc' | 'desc'>('asc')

const fileCount = computed(() => items.value.filter(i => i.isFile).length)
const sortedItems = computed(() => {
  return items.value.slice().sort((a, b) => {
    const nameA = a.name.toLowerCase()
    const nameB = b.name.toLowerCase()
    // sort by type first, folder before file
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    // then by name
    if (sortDirection.value === 'asc') {
      return nameA.localeCompare(nameB)
    } else {
      return nameB.localeCompare(nameA)
    }
  })
})

const SPECIAL_ACTION = computed(() => {
  const naming = failureFirstLoad.value ? 'Go to Root' : '..'
  return {
    name: naming,
    isDirectory: true,
    isFile: false,
    isGoUp: true,
    path: '',
    size: 0,
    modified: ''
  }
})

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

  verified.value = data.value?.passwordProtected === false ? true : (data.value?.isAuthenticated || false)
  await nextTick()

  if (verified.value) {
    loadFolder(path, true)
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

const loadFolder = async (path: string, isFirstMount = false) => {
  browseLoading.value = true
  failureFirstLoad.value = false
  let hasFailure = false
  try {
    const data = await $fetch(`/api/share/${token}/browse?path=${encodeURIComponent(path)}&showHidden=${showHidden.value}`)
    currentPath.value = data.currentPath
    items.value = data.items
  } catch (err: any) {
    if (err.data?.message === 'Path must be a directory' && path && isFirstMount) {
      // try fetching as file info instead
      viewFileInfo(constructFakePath(path))
      currentPath.value = path
    } else {
      if (err.data?.message === 'File or folder not found' && path && isFirstMount) {
        failureFirstLoad.value = true
        currentPath.value = path
      }
      toast.add({
        title: 'Error',
        description: err.data?.message || 'Failed to load folder',
        color: 'error'
      })
      hasFailure = true
    }
  } finally {
    browseLoading.value = false
  }

  if (hasFailure) return
  useSeoMeta({
    title: `${shareName.value} - /${currentPath.value}`,
    ogTitle: 'filearr',
    description: 'stupidly simple file sharing',
    ogDescription: `viewing: /${currentPath.value}`,
  })
  router.push({
    query: currentPath.value ? { path: currentPath.value } : {}
  })
}

const constructFakePath = (path: string): BrowseItem => {
  return {
    path,
    name: '',
    isDirectory: false,
    isFile: true,
    size: 0,
    modified: ''
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
    lastSelectedIndex.value = null
  }
}

const toggleFileSelection = (path: string, shiftKey: boolean = false) => {
  // Get only files (not directories)
  const fileItems = items.value.filter(item => item.isFile)
  const currentIndex = fileItems.findIndex(item => item.path === path)
  
  if (currentIndex === -1) return

  // Handle shift-click for range selection
  if (shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, currentIndex)
    const end = Math.max(lastSelectedIndex.value, currentIndex)
    
    // Select all files in range
    for (let i = start; i <= end; i++) {
      const file = fileItems[i]
      if (file) {
        selectedFiles.value.add(file.path)
      }
    }
  } else {
    // Normal toggle
    if (selectedFiles.value.has(path)) {
      selectedFiles.value.delete(path)
      lastSelectedIndex.value = null
    } else {
      selectedFiles.value.add(path)
      lastSelectedIndex.value = currentIndex
    }
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
  router.push({
    query: { path: item.path }
  })
}

const backToBrowse = () => {
  viewThisFile.value = null
  if (!items.value.length && path) {
    loadFolder('') // reload root if no items
  } else {
    router.push({
      query: currentPath.value ? { path: currentPath.value } : {}
    })
  }
}

const navigateUpSpecial = () => {
  if (failureFirstLoad.value) {
    loadFolder('')
  } else {
    navigateUp()
  }
}

const doSelectAll = () => {
  const fileItems = items.value.filter(item => item.isFile)
  selectedFiles.value = new Set(fileItems.map(item => item.path))
}

const doDeselectAll = () => {
  selectedFiles.value.clear()
}

// check query param path changes
watch(() => route.query.path, (newPath) => {
  const pathStr = newPath as string || ''
  if (pathStr !== currentPath.value && !viewThisFile.value) {
    loadFolder(pathStr)
  } else if (viewThisFile.value && pathStr !== viewThisFile.value.path) {
    viewThisFile.value = null
    loadFolder(pathStr)
  }
})

useSeoMeta({
  title: `${data.value?.name || 'Shared Folder'} - /${currentPath.value}`,
  ogTitle: 'filearr',
  description: 'stupidly simple file sharing',
  ogDescription: 'stupidly simple file sharing',
})
</script>
