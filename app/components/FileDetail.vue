<template>
  <div class="flex items-center justify-between hover:bg-gray-800 rounded border border-gray-800 transition-colors">
    <button v-if="item.isDirectory" @click="$emit('navigate', item.path)" class="flex items-center gap-3 flex-1 text-left cursor-pointer h-full px-3 py-4">
      <UIcon name="i-heroicons-folder" class="text-yellow-500 text-xl ml-1" />
      <span class="font-semibold">{{ item.name }}</span>
    </button>
    <div v-else class="flex items-center gap-3 flex-1 mr-1 px-3 py-4">
      <UIcon name="i-heroicons-document" class="text-gray-500 text-xl ml-1" />
      <span class="font-semibold">{{ item.name }}</span>
      <span class="text-gray-600 text-xs ml-auto">{{ formatSize(item.size) }}</span>
    </div>
    <UButton v-if="item.isFile" @click="$emit('download', item.path)" class="font-bold tracking-wider cursor-pointer mr-3 py-2" variant="outline" size="sm" icon="i-heroicons-arrow-down-tray">Download</UButton>
  </div>
</template>

<script setup lang="ts">
import type { BrowseItem } from '~~/server/api/share/[token]/browse.get';

defineProps<{
  item: BrowseItem
}>();

defineEmits<{
  navigate: [path: string];
  download: [path: string];
}>();


const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>