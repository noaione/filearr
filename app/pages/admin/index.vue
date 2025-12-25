<template>
  <div class="space-y-6 p-4">
    <div class="flex items-center justify-between mt-4">
      <div>
        <h2 class="text-2xl font-bold tracking-wide">Shared Folders</h2>
        <p class="text-gray-500 text-sm mt-1">Manage your shared folders and links</p>
      </div>
      <UButton
        @click="isCreateModalOpen = true"
        size="lg"
        icon="i-heroicons-plus"
      >
        Create Share
      </UButton>
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
          icon="i-heroicons-plus"
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
              <h3 class="font-bold text-lg">{{ share.name }}</h3>
              <p class="text-gray-500 text-sm font-mono">{{ share.path }}</p>
            </div>
            <UButton
              @click="deleteShare(share.id)"
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              size="sm"
            />
          </div>

          <div class="flex items-center gap-4 text-xs text-gray-500">
            <div class="flex items-center gap-1">
              <UIcon name="i-heroicons-arrow-down-tray" />
              <span>{{ share.downloadCount }} downloads</span>
            </div>
            <div v-if="share.password" class="flex items-center gap-1">
              <UIcon name="i-heroicons-lock-closed" />
              <span>Password protected</span>
            </div>
            <div v-if="share.expiresAt" class="flex items-center gap-1">
              <UIcon name="i-heroicons-clock" />
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
              icon="i-heroicons-clipboard-document"
              size="sm"
            >
              Copy
            </UButton>
          </div>
        </div>
      </UCard>
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
              />
            </UFormField>
  
            <UFormField label="Browse Folder" required>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <UInput
                    v-model="browsePath"
                    placeholder="/"
                    class="flex-1"
                    readonly
                  />
                  <UButton
                    @click="isBrowseModalOpen = true"
                    variant="outline"
                    color="neutral"
                    icon="i-heroicons-folder"
                  >
                    Browse
                  </UButton>
                </div>
              </div>
            </UFormField>
  
            <UFormField label="Password (optional)">
              <UInput
                v-model="newShare.password"
                type="password"
                class="pr-4"
                autocomplete="new-password"
                
                placeholder="Leave empty for no password"
              />
            </UFormField>
  
            <UFormField label="Expiration Date (optional)">
              <UInput
                v-model="newShare.expiresAt"
                type="datetime-local"
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
              <UButton
                v-if="browsePath"
                @click="navigateUp"
                variant="ghost"
                size="sm"
                icon="i-heroicons-arrow-up"
              >
                Up
              </UButton>
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
  
            <div v-else class="space-y-1">
              <button
                v-for="item in browseItems.filter(i => i.isDirectory)"
                :key="item.path"
                @click="navigateToFolder(item.path)"
                class="w-full flex items-center gap-2 p-3 hover:bg-gray-800 rounded border border-gray-800 text-left transition-colors"
              >
                <UIcon name="i-heroicons-folder" class="text-yellow-500" />
                <span class="font-mono text-sm">{{ item.name }}</span>
              </button>
            </div>
          </div>
  
          <template #footer>
            <div class="flex gap-2">
              <UButton
                @click="selectCurrentFolder"
                class="flex-1"
                :disabled="!browsePath"
              >
                Select Current Folder
              </UButton>
              <UButton
                @click="isBrowseModalOpen = false"
                variant="ghost"
                color="neutral"
              >
                Cancel
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const sharesStore = useSharesStore()
const toast = useToast()

const isCreateModalOpen = ref(false)
const isBrowseModalOpen = ref(false)
const creating = ref(false)
const createError = ref('')

const newShare = ref({
  name: '',
  password: '',
  expiresAt: '',
})

const browsePath = ref('')
const browseItems = ref<any[]>([])
const browseLoading = ref(false)

// Load shares on mount
onMounted(() => {
  sharesStore.fetchShares()
})

// Browse functionality
const loadBrowseFolder = async (path: string = '') => {
  browseLoading.value = true
  try {
    const data = await $fetch(`/api/admin/browse?path=${encodeURIComponent(path)}`)
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

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
