<template>
  <div class="w-full sm:max-w-3xl">
    <UCard class="bg-gray-950 border border-gray-800">
      <template #header>
        <div class="flex items-start gap-3">
          <UButton
            @click="$emit('goBack')"
            variant="ghost"
            size="sm"
            icon="heroicons:arrow-left"
            class="shrink-0 cursor-pointer mt-1 font-bold"
          >
            Back
          </UButton>
          <div class="flex-1 min-w-0">
            <h2 class="text-xl sm:text-2xl font-extrabold tracking-wide wrap-break-word">{{ currentFile?.name || 'File Details' }}</h2>
          </div>
        </div>
      </template>

      <div v-if="fileLoading" class="text-center py-12 text-gray-500">
        Loading file information...
      </div>
      <div v-else-if="currentFile" class="space-y-6">
        <!-- File Icon -->
        <div class="flex justify-center py-8">
          <UIcon name="heroicons:document" class="text-gray-500 text-6xl" />
        </div>

        <!-- File Information -->
        <div class="space-y-4">
          <div class="border border-gray-800 rounded p-4 space-y-3">
            <FileInfoDetail label="File Name" :value="currentFile.name" />
            <div class="border-t border-gray-800"></div>
            <FileInfoDetail label="Size" :value="formatSize(currentFile.size)" />
            <div class="border-t border-gray-800"></div>
            <FileInfoDetail label="MIME Type" :value="currentFile.mimeType" />
            <div class="border-t border-gray-800"></div>
            <FileInfoDetail label="Extension" :value="currentFile.extension" />
            <div class="border-t border-gray-800"></div>
            <FileInfoDetail label="Created" :value="formatDate(currentFile.created)" />
            <div class="border-t border-gray-800"></div>
            <FileInfoDetail label="Modified" :value="formatDate(currentFile.modified)" />
            <div class="border-t border-gray-800"></div>
            <FileInfoDetail label="Path" :value="currentFile.path || '/'" darker break-apart />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3">
          <UButton
            @click="$emit('download', currentFile.path)"
            block
            size="lg"
            icon="heroicons:arrow-down-tray"
            class="font-bold tracking-wider cursor-pointer"
          >
            Download File
          </UButton>
          <UButton
            @click="$emit('goBack')"
            block
            size="lg"
            variant="outline"
            icon="heroicons:arrow-left"
            class="font-bold tracking-wider cursor-pointer"
          >
            Back to Folder
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { BrowseItem } from '~~/server/api/share/[token]/browse.get';

const toast = useToast()

const props = defineProps<{
  item: BrowseItem
  token: string
  selectionMode?: boolean
  isSelected?: boolean
}>();

const emits = defineEmits<{
  download: [path: string];
  goBack: [];
}>();

const currentFile = ref<any>(null)
const fileLoading = ref(false)

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const viewFile = async (filePath: string) => {
  fileLoading.value = true
  try {
    const data = await $fetch(`/api/share/${props.token}/file-info?path=${encodeURIComponent(filePath)}`)
    currentFile.value = data
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.message || 'Failed to load file information',
      color: 'error'
    })
    emits('goBack')
  } finally {
    fileLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

// watch item and token props to load file info
watch(() => [props.item, props.token], ([newItem, newToken]) => {
  if (newItem && typeof newItem !== 'string' && newItem.isFile) {
    viewFile(newItem.path)
  }
}, { immediate: true })
</script>