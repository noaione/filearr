<template>
  <div v-if="!loadAuth" class="space-y-6">
    <div class="flex items-center justify-between mt-4">
      <div>
        <h2 class="text-2xl font-extrabold tracking-normal">Shared Folders</h2>
        <p class="text-gray-400 text-sm mt-2 font-semibold tracking-wide">Manage your shared folders and links</p>
      </div>
      <div class="hidden sm:flex sm:flex-row sm:gap-2">
        <UButton
          @click="isCreateModalOpen = true"
          size="lg"
          color="primary"
          icon="heroicons:folder-plus"
          >
          Share Folder
        </UButton>
        <UButton
          @click="isCreateFileShareModalOpen = true"
          size="lg"
          color="secondary"
          icon="heroicons:document-plus"
          >
          Share File
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="sharesStore.loading" class="flex justify-center py-12">
      <div class="text-gray-500">Loading...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="sharesStore.shares.length === 0" class="text-center py-12 border border-gray-800 rounded-lg">
      <div class="space-y-3">
        <div class="text-gray-500">No shared folders yet</div>
        <UButton
          @click="isCreateModalOpen = true"
          variant="outline"
          color="neutral"
          icon="heroicons:plus"
        >
          Create Your First Share
        </UButton>
      </div>
    </div>

    <!-- Shares List -->
    <div v-else class="grid gap-4">
      <UCard
        v-for="share in sharesStore.shares"
        :key="share.id"
        class="bg-gray-950 border border-gray-800"
      >
        <div class="space-y-3">
          <div class="flex items-start justify-between">
            <div class="space-y-1 flex-1">
              <h3 class="font-extrabold text-lg">{{ share.name }}</h3>
              <p class="text-gray-500 text-sm font-mono mt-1.5 font-semibold">{{ share.path }}</p>
            </div>
            <div class="flex gap-2">
              <UButton
                v-if="!isShareExpired(share.expiresAt)"
                @click="openEditModal(share)"
                color="warning"
                variant="ghost"
                icon="heroicons:pencil"
                size="sm"
              />
              <UButton
                @click="deleteShare(share.id)"
                color="error"
                variant="ghost"
                icon="heroicons:trash"
                size="sm"
              />
            </div>
          </div>

          <div class="flex items-center gap-4 text-xs text-gray-500">
            <div class="flex items-center gap-2">
              <UIcon name="heroicons:arrow-down-tray" />
              <span>{{ share.downloadCount ?? 0 }} downloads</span>
            </div>
            <div v-if="share.password" class="flex items-center gap-1">
              <UIcon name="heroicons:lock-closed" />
              <span>Password protected</span>
            </div>
            <div v-if="share.expiresAt" class="flex items-center gap-1">
              <UIcon name="heroicons:clock" />
              <span>Expires {{ formatDate(share.expiresAt) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <UInput
              :model-value="sharesStore.getShareUrl(share.shareToken)"
              readonly
              class="flex-1"
              size="sm"
            />
            <UButton
              @click="copyUrl(share.shareToken)"
              variant="outline"
              color="neutral"
              icon="heroicons:clipboard-document"
              size="sm"
            >
              Copy
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- File Shares Section -->
    <div class="mt-8">
      <h2 class="text-2xl font-extrabold tracking-normal mb-4">Shared Files</h2>
      
      <!-- Loading State -->
      <div v-if="sharesStore.loading" class="flex justify-center py-12">
        <div class="text-gray-500">Loading...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="sharesStore.fileShares.length === 0" class="text-center py-12 border border-gray-800 rounded-lg">
        <div class="space-y-3">
          <div class="text-gray-500">No shared files yet</div>
          <UButton
            @click="isCreateFileShareModalOpen = true"
            variant="outline"
            color="neutral"
            icon="heroicons:document-plus"
          >
            Share Your First File
          </UButton>
        </div>
      </div>

      <!-- File Shares List -->
      <div v-else class="grid gap-4">
        <UCard
          v-for="share in sharesStore.fileShares"
          :key="share.id"
          class="bg-gray-950 border border-gray-800"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <div class="space-y-1 flex-1">
                <h3 class="font-extrabold text-lg">{{ share.name }}</h3>
                <p class="text-gray-500 text-sm font-mono mt-1.5 font-semibold">{{ share.path }}</p>
              </div>
              <div class="flex gap-2">
                <UButton
                  v-if="!isShareExpired(share.expiresAt)"
                  @click="openEditFileModal(share)"
                  color="primary"
                  variant="ghost"
                  icon="heroicons:pencil"
                  size="sm"
                />
                <UButton
                  @click="deleteFileShare(share.id)"
                  color="error"
                  variant="ghost"
                  icon="heroicons:trash"
                  size="sm"
                />
              </div>
            </div>

            <div class="flex items-center gap-4 text-xs text-gray-500">
              <div class="flex items-center gap-2">
                <UIcon name="heroicons:arrow-down-tray" />
                <span>{{ share.downloadCount ?? 0 }} downloads</span>
              </div>
              <div v-if="share.password" class="flex items-center gap-1">
                <UIcon name="heroicons:lock-closed" />
                <span>Password protected</span>
              </div>
              <div v-if="share.expiresAt" class="flex items-center gap-1">
                <UIcon name="heroicons:clock" />
                <span>Expires {{ formatDate(share.expiresAt) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <UInput
                :model-value="sharesStore.getFileShareUrl(share.shareToken)"
                readonly
                class="flex-1"
                size="sm"
              />
              <UButton
                @click="copyFileUrl(share.shareToken)"
                variant="outline"
                color="neutral"
                icon="heroicons:clipboard-document"
                size="sm"
              >
                Copy
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <div class="flex flex-row w-full gap-2 sm:hidden justify-end items-end">
      <UButton
        @click="isCreateModalOpen = true"
        size="lg"
        color="primary"
        icon="heroicons:folder-plus"
        class="w-full"
      >
        Share Folder
      </UButton>
      <UButton
        @click="isCreateFileShareModalOpen = true"
        size="lg"
        color="secondary"
        icon="heroicons:document-plus"
        class="w-full"
      >
        Share File
      </UButton>
    </div>

    <!-- Create Share Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-bold">Create Shared Folder</h3>
          </template>
  
          <form @submit.prevent="handleCreateShare" class="space-y-4">
            <UFormField label="Name" required>
              <UInput
                v-model="newShare.name"
                placeholder="My Shared Folder"
                class="w-full"
              />
            </UFormField>
  
            <UFormField label="Browse Folder" required>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <UInput
                    v-model="browsePathDisplay"
                    placeholder="/"
                    class="flex-1"
                    readonly
                  />
                  <UButton
                    @click="isBrowseModalOpen = true"
                    variant="outline"
                    color="neutral"
                    icon="heroicons:folder"
                  >
                    Browse
                  </UButton>
                </div>
              </div>
            </UFormField>
  
            <UFormField label="Password (optional)">
              <UInput
                v-model="newShare.password"
                type="text"
                class="w-full"
                autocomplete="off"
                placeholder="Leave empty for no password"
              />
            </UFormField>
  
            <UFormField label="Expiration Date (optional)">
              <UInput
                v-model="newShare.expiresAt"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
  
            <div v-if="createError" class="text-red-500 text-sm">
              {{ createError }}
            </div>
  
            <div class="flex gap-2">
              <UButton
                type="submit"
                :loading="creating"
                :disabled="!newShare.name || !browsePath"
                class="flex-1"
                color="secondary"
              >
                Create Share
              </UButton>
              <UButton
                @click="isCreateModalOpen = false"
                variant="ghost"
                color="neutral"
              >
                Cancel
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Browse Modal -->
    <UModal v-model:open="isBrowseModalOpen" :ui="{ body: 'max-w-2xl' }">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold">Browse Folders</h3>
              <div class="flex items-center gap-2">
                <label class="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
                  <input
                    v-model="showHiddenAdmin"
                    type="checkbox"
                    class="rounded bg-gray-800 border-gray-700 text-white focus:ring-white focus:ring-offset-gray-950"
                    @change="loadBrowseFolder(browsePath)"
                  />
                  <span>Hidden</span>
                </label>
                <UButton
                  v-if="browsePath"
                  @click="navigateUp"
                  variant="ghost"
                  size="sm"
                  icon="heroicons:arrow-up"
                >
                  Up
                </UButton>
              </div>
            </div>
          </template>
  
          <div class="space-y-2">
            <div class="text-sm text-gray-500 font-mono mb-4">
              {{ browsePath || '/' }}
            </div>
  
            <div v-if="browseLoading" class="text-center py-8 text-gray-500">
              Loading...
            </div>
  
            <div v-else-if="browseItems.length === 0" class="text-center py-8 text-gray-500">
              No folders found
            </div>
  
            <div v-else class="space-y-1 max-h-96 overflow-y-auto pr-2">
              <button
                v-for="item in browseItems.filter(i => i.isDirectory)"
                :key="item.path"
                @click="navigateToFolder(item.path)"
                class="w-full flex items-center gap-2 p-3 hover:bg-gray-800 rounded border border-gray-800 text-left transition-colors"
              >
                <UIcon name="heroicons:folder" class="text-yellow-500" />
                <span class="font-mono text-sm">{{ item.name }}</span>
              </button>
            </div>
          </div>
  
          <template #footer>
            <div class="flex gap-2">
              <UButton
                @click="selectCurrentFolder"
                class="flex-1"
                color="neutral"
                :disabled="!browsePath"
              >
                Select Current Folder
              </UButton>
              <UButton
                @click="isBrowseModalOpen = false"
                variant="ghost"
                color="secondary"
              >
                Cancel
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Create File Share Modal -->
    <UModal v-model:open="isCreateFileShareModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-bold">Share File</h3>
          </template>
  
          <form @submit.prevent="handleCreateFileShare" class="space-y-4">
            <UFormField label="Name" required>
              <UInput
                v-model="newFileShare.name"
                placeholder="My Shared File"
                class="w-full"
              />
            </UFormField>
  
            <UFormField label="Browse File" required>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <UInput
                    v-model="browseFilePathDisplay"
                    placeholder="/"
                    class="flex-1"
                    readonly
                  />
                  <UButton
                    @click="isBrowseFileModalOpen = true"
                    variant="outline"
                    color="neutral"
                    icon="heroicons:document"
                  >
                    Browse
                  </UButton>
                </div>
              </div>
            </UFormField>
  
            <UFormField label="Password (optional)">
              <UInput
                v-model="newFileShare.password"
                type="text"
                class="w-full"
                autocomplete="off"
                placeholder="Leave empty for no password"
              />
            </UFormField>
  
            <UFormField label="Expiration Date (optional)">
              <UInput
                v-model="newFileShare.expiresAt"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
  
            <div v-if="createFileError" class="text-red-500 text-sm">
              {{ createFileError }}
            </div>
  
            <div class="flex gap-2">
              <UButton
                type="submit"
                :loading="creatingFile"
                :disabled="!newFileShare.name || !browseFilePath"
                class="flex-1"
                color="secondary"
              >
                Share File
              </UButton>
              <UButton
                @click="isCreateFileShareModalOpen = false"
                variant="ghost"
                color="neutral"
              >
                Cancel
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Browse File Modal -->
    <UModal v-model:open="isBrowseFileModalOpen" :ui="{ body: 'max-w-2xl' }">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold">Browse Files</h3>
              <div class="flex items-center gap-2">
                <label class="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
                  <input
                    v-model="showHiddenAdminFile"
                    type="checkbox"
                    class="rounded bg-gray-800 border-gray-700 text-white focus:ring-white focus:ring-offset-gray-950"
                    @change="loadBrowseFileFolder(browseFilePath)"
                  />
                  <span>Hidden</span>
                </label>
                <UButton
                  v-if="browseFilePath"
                  @click="navigateFileUp"
                  variant="ghost"
                  size="sm"
                  icon="heroicons:arrow-up"
                >
                  Up
                </UButton>
              </div>
            </div>
          </template>
  
          <div class="space-y-2">
            <div class="text-sm text-gray-500 font-mono mb-4">
              {{ browseFilePath || '/' }}
            </div>
  
            <div v-if="browseFileLoading" class="text-center py-8 text-gray-500">
              Loading...
            </div>
  
            <div v-else-if="browseFileItems.length === 0" class="text-center py-8 text-gray-500">
              No items found
            </div>
  
            <div v-else class="space-y-1 max-h-96 overflow-y-auto pr-2">
              <button
                v-for="item in browseFileItems"
                :key="item.path"
                @click="item.isDirectory ? navigateToFileFolder(item.path) : selectFile(item)"
                class="w-full flex items-center gap-2 p-3 hover:bg-gray-800 rounded border border-gray-800 text-left transition-colors"
                :class="{ 'bg-gray-800': selectedFilePath === item.path && item.isFile }"
              >
                <UIcon :name="item.isDirectory ? 'heroicons:folder' : 'heroicons:document'" :class="item.isDirectory ? 'text-yellow-500' : 'text-blue-500'" />
                <span class="font-mono text-sm flex-1">{{ item.name }}</span>
                <span v-if="item.isFile" class="text-xs text-gray-500">{{ formatFileSize(item.size) }}</span>
              </button>
            </div>
          </div>
  
          <template #footer>
            <div class="flex gap-2">
              <UButton
                @click="confirmFileSelection"
                class="flex-1"
                color="neutral"
                :disabled="!selectedFilePath"
              >
                Select File
              </UButton>
              <UButton
                @click="isBrowseFileModalOpen = false"
                variant="ghost"
                color="secondary"
              >
                Cancel
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Edit Folder Share Modal -->
    <UModal v-model:open="isEditModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-bold">Edit Shared Folder</h3>
          </template>
  
          <form @submit.prevent="handleEditShare" class="space-y-4">
            <UFormField label="Name" required>
              <UInput
                v-model="editShare.name"
                placeholder="My Shared Folder"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Path (read-only)">
              <UInput
                :model-value="editShare.path"
                class="w-full"
                readonly
                disabled
              />
            </UFormField>
  
            <UFormField label="Password (leave empty to remove, or enter new password)">
              <UInput
                v-model="editShare.password"
                type="text"
                class="w-full"
                autocomplete="off"
                placeholder="Leave empty to keep current or remove"
              />
            </UFormField>
  
            <UFormField label="Expiration Date (optional)">
              <UInput
                v-model="editShare.expiresAt"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
  
            <div v-if="editError" class="text-red-500 text-sm">
              {{ editError }}
            </div>
  
            <div class="flex gap-2">
              <UButton
                type="submit"
                :loading="editing"
                :disabled="!editShare.name"
                class="flex-1"
                color="secondary"
              >
                Update Share
              </UButton>
              <UButton
                @click="isEditModalOpen = false"
                variant="ghost"
                color="neutral"
              >
                Cancel
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>

    <!-- Edit File Share Modal -->
    <UModal v-model:open="isEditFileModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-bold">Edit Shared File</h3>
          </template>
  
          <form @submit.prevent="handleEditFileShare" class="space-y-4">
            <UFormField label="Name" required>
              <UInput
                v-model="editFileShare.name"
                placeholder="My Shared File"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Path (read-only)">
              <UInput
                :model-value="editFileShare.path"
                class="w-full"
                readonly
                disabled
              />
            </UFormField>
  
            <UFormField label="Password (leave empty to remove, or enter new password)">
              <UInput
                v-model="editFileShare.password"
                type="text"
                class="w-full"
                autocomplete="off"
                placeholder="Leave empty to keep current or remove"
              />
            </UFormField>
  
            <UFormField label="Expiration Date (optional)">
              <UInput
                v-model="editFileShare.expiresAt"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
  
            <div v-if="editFileError" class="text-red-500 text-sm">
              {{ editFileError }}
            </div>
  
            <div class="flex gap-2">
              <UButton
                type="submit"
                :loading="editingFile"
                :disabled="!editFileShare.name"
                class="flex-1"
                color="secondary"
              >
                Update File Share
              </UButton>
              <UButton
                @click="isEditFileModalOpen = false"
                variant="ghost"
                color="neutral"
              >
                Cancel
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
useSeoMeta({
  title: 'filearr - Admin',
  ogTitle: 'filearr - Admin',
  description: 'manage your shared folders and links',
  ogDescription: 'manage your shared folders and links',
})

const config = useRuntimeConfig()
const authStore = useAuthStore()
const router = useRouter()
const sharesStore = useSharesStore()
const toast = useToast()

const loadAuth = ref(true)
const isCreateModalOpen = ref(false)
const isBrowseModalOpen = ref(false)
const creating = ref(false)
const createError = ref('')

// Edit folder share state
const isEditModalOpen = ref(false)
const editing = ref(false)
const editError = ref('')
const editShare = ref({
  id: '',
  name: '',
  path: '',
  password: '',
  expiresAt: '',
})

// File share state
const isCreateFileShareModalOpen = ref(false)
const isBrowseFileModalOpen = ref(false)
const creatingFile = ref(false)
const createFileError = ref('')

// Edit file share state
const isEditFileModalOpen = ref(false)
const editingFile = ref(false)
const editFileError = ref('')
const editFileShare = ref({
  id: '',
  name: '',
  path: '',
  password: '',
  expiresAt: '',
})

const newShare = ref({
  name: '',
  password: '',
  expiresAt: '',
})

const newFileShare = ref({
  name: '',
  password: '',
  expiresAt: '',
})

const browsePath = ref('')
const browseItems = ref<any[]>([])
const browseLoading = ref(false)
const showHiddenAdmin = ref(false)

// File browse state
const browseFilePath = ref('')
const browseFileItems = ref<any[]>([])
const browseFileLoading = ref(false)
const showHiddenAdminFile = ref(false)
const selectedFilePath = ref('')
const selectedFileName = ref('')

const browsePathDisplay = computed(() => {
  return `./${browsePath.value}`
})

const browseFilePathDisplay = computed(() => {
  return `./${browseFilePath.value}`
})

// Load shares on mount
onMounted(async () => {
  try {
    await authStore.checkAuth()
    if (authStore.isLoggedIn) {
      loadAuth.value = false
      sharesStore.fetchShares()
      sharesStore.fetchFileShares()

      useSeoMeta({
        title: 'filearr - Admin',
        description: 'stupidly simple file sharing server',
        ogTitle: 'filearr - Admin',
        ogDescription: 'stupidly simple file sharing server',
        ogUrl: config.public.siteUrl + '/admin',
        ogImage: `${config.public.siteUrl}/assets/favicons/android-chrome-512x512.png`,
        ogType: 'website',
        twitterTitle: 'filearr - Admin',
        twitterDescription: 'stupidly simple file sharing server',
        twitterImage: `${config.public.siteUrl}/assets/favicons/android-chrome-512x512.png`,
        twitterCard: 'summary'
      })
    } else {
      router.push('/login')
    }
  } catch {
    router.push('/login')
  }
})

// Browse functionality
const loadBrowseFolder = async (path: string = '') => {
  browseLoading.value = true
  try {
    const data = await $fetch(`/api/admin/browse?path=${encodeURIComponent(path)}&showHidden=${showHiddenAdmin.value}`)
    browseItems.value = data.items
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to load folder',
      color: 'error'
    })
  } finally {
    browseLoading.value = false
  }
}

watch(isBrowseModalOpen, (isOpen) => {
  if (isOpen) {
    loadBrowseFolder(browsePath.value)
  }
})

const navigateToFolder = (path: string) => {
  browsePath.value = path
  loadBrowseFolder(path)
}

const navigateUp = () => {
  const parts = browsePath.value.split('/').filter(Boolean)
  parts.pop()
  browsePath.value = parts.join('/')
  loadBrowseFolder(browsePath.value)
}

const selectCurrentFolder = () => {
  newShare.value.name = newShare.value.name || browsePath.value.split('/').pop() || 'Shared Folder'
  isBrowseModalOpen.value = false
}

// Create share
const handleCreateShare = async () => {
  creating.value = true
  createError.value = ''

  const result = await sharesStore.createShare({
    ...newShare.value,
    path: browsePath.value,
  })

  if (result.success) {
    toast.add({
      title: 'Success',
      description: 'Share created successfully',
      color: 'success'
    })
    isCreateModalOpen.value = false
    newShare.value = { name: '', password: '', expiresAt: '' }
    browsePath.value = ''
  } else {
    createError.value = result.error || 'Failed to create share'
  }

  creating.value = false
}

// Delete share
const deleteShare = async (id: string) => {
  if (!confirm('Are you sure you want to delete this share?')) return

  const result = await sharesStore.deleteShare(id)

  if (result.success) {
    toast.add({
      title: 'Success',
      description: 'Share deleted successfully',
      color: 'success'
    })
  } else {
    toast.add({
      title: 'Error',
      description: result.error || 'Failed to delete share',
      color: 'error'
    })
  }
}

// Copy URL
const copyUrl = (token: string) => {
  const url = sharesStore.getShareUrl(token)
  navigator.clipboard.writeText(url)
  toast.add({
    title: 'Copied!',
    description: 'Share URL copied to clipboard',
    color: 'success'
  })
}

const copyFileUrl = (token: string) => {
  const url = sharesStore.getFileShareUrl(token)
  navigator.clipboard.writeText(url)
  toast.add({
    title: 'Copied!',
    description: 'File share URL copied to clipboard',
    color: 'success'
  })
}

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// File browse functionality
const loadBrowseFileFolder = async (path: string = '') => {
  browseFileLoading.value = true
  try {
    const data = await $fetch(`/api/admin/browse?path=${encodeURIComponent(path)}&showHidden=${showHiddenAdminFile.value}`)
    browseFileItems.value = data.items
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to load folder',
      color: 'error'
    })
  } finally {
    browseFileLoading.value = false
  }
}

watch(isBrowseFileModalOpen, (isOpen) => {
  if (isOpen) {
    loadBrowseFileFolder(browseFilePath.value)
  }
})

const navigateToFileFolder = (path: string) => {
  browseFilePath.value = path
  selectedFilePath.value = ''
  loadBrowseFileFolder(path)
}

const navigateFileUp = () => {
  const parts = browseFilePath.value.split('/').filter(Boolean)
  parts.pop()
  browseFilePath.value = parts.join('/')
  selectedFilePath.value = ''
  loadBrowseFileFolder(browseFilePath.value)
}

const selectFile = (item: any) => {
  if (item.isFile) {
    selectedFilePath.value = item.path
    selectedFileName.value = item.name
  }
}

const confirmFileSelection = () => {
  if (selectedFilePath.value) {
    browseFilePath.value = selectedFilePath.value
    newFileShare.value.name = newFileShare.value.name || selectedFileName.value
    isBrowseFileModalOpen.value = false
  }
}

// Create file share
const handleCreateFileShare = async () => {
  creatingFile.value = true
  createFileError.value = ''

  const result = await sharesStore.createFileShare({
    ...newFileShare.value,
    path: browseFilePath.value,
  })

  if (result.success) {
    toast.add({
      title: 'Success',
      description: 'File share created successfully',
      color: 'success'
    })
    isCreateFileShareModalOpen.value = false
    newFileShare.value = { name: '', password: '', expiresAt: '' }
    browseFilePath.value = ''
    selectedFilePath.value = ''
    selectedFileName.value = ''
  } else {
    createFileError.value = result.error || 'Failed to create file share'
  }

  creatingFile.value = false
}

// Delete file share
const deleteFileShare = async (id: string) => {
  if (!confirm('Are you sure you want to delete this file share?')) return

  const result = await sharesStore.deleteFileShare(id)

  if (result.success) {
    toast.add({
      title: 'Success',
      description: 'File share deleted successfully',
      color: 'success'
    })
  } else {
    toast.add({
      title: 'Error',
      description: result.error || 'Failed to delete file share',
      color: 'error'
    })
  }
}

// Check if share is expired
const isShareExpired = (expiresAt: string | null) => {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

// Open edit folder share modal
const openEditModal = (share: any) => {
  editShare.value = {
    id: share.id,
    name: share.name,
    path: share.path,
    password: '',
    expiresAt: share.expiresAt ? new Date(share.expiresAt).toISOString().slice(0, 16) : '',
  }
  isEditModalOpen.value = true
}

// Handle edit folder share
const handleEditShare = async () => {
  editing.value = true
  editError.value = ''

  const updateData: any = {
    name: editShare.value.name,
  }

  // Only include password if it's changed
  if (editShare.value.password) {
    updateData.password = editShare.value.password
  }

  // Include expiry
  if (editShare.value.expiresAt) {
    updateData.expiresAt = editShare.value.expiresAt
  }

  const result = await sharesStore.updateShare(editShare.value.id, updateData)

  if (result.success) {
    toast.add({
      title: 'Success',
      description: 'Share updated successfully',
      color: 'success'
    })
    isEditModalOpen.value = false
    editShare.value = { id: '', name: '', path: '', password: '', expiresAt: '' }
  } else {
    editError.value = result.error || 'Failed to update share'
  }

  editing.value = false
}

// Open edit file share modal
const openEditFileModal = (share: any) => {
  editFileShare.value = {
    id: share.id,
    name: share.name,
    path: share.path,
    password: '',
    expiresAt: share.expiresAt ? new Date(share.expiresAt).toISOString().slice(0, 16) : '',
  }
  isEditFileModalOpen.value = true
}

// Handle edit file share
const handleEditFileShare = async () => {
  editingFile.value = true
  editFileError.value = ''

  const updateData: any = {
    name: editFileShare.value.name,
  }

  // Only include password if it's changed
  if (editFileShare.value.password) {
    updateData.password = editFileShare.value.password
  }

  // Include expiry
  if (editFileShare.value.expiresAt) {
    updateData.expiresAt = editFileShare.value.expiresAt
  }

  const result = await sharesStore.updateFileShare(editFileShare.value.id, updateData)

  if (result.success) {
    toast.add({
      title: 'Success',
      description: 'File share updated successfully',
      color: 'success'
    })
    isEditFileModalOpen.value = false
    editFileShare.value = { id: '', name: '', path: '', password: '', expiresAt: '' }
  } else {
    editFileError.value = result.error || 'Failed to update file share'
  }

  editingFile.value = false
}
</script>
