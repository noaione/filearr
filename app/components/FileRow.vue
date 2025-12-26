<template>
  <div class="hover:bg-gray-800 rounded border border-gray-800 transition-colors">
    <!-- Directory -->
    <button 
      v-if="item.isDirectory" 
      @click="$emit('navigate', item.path)" 
      class="flex items-start gap-3 w-full text-left cursor-pointer px-3 py-4"
    >
      <UIcon :name="item.isGoUp ? 'i-heroicons-arrow-uturn-left' : 'i-heroicons-folder'" class="text-yellow-500 text-xl shrink-0 mt-0.5" />
      <span class="font-semibold break-all sm:truncate">{{ item.name }}</span>
    </button>
    
    <!-- File -->
    <div
      v-else
      class="flex flex-col sm:flex-row sm:items-center gap-3 px-3 py-4"
      :class="{
        'cursor-pointer': selectionMode || !selectionMode
      }"
      @click="!selectionMode && $emit('viewFile', item)"
    >
      <div class="flex items-start gap-3 flex-1 min-w-0">
        <StupidCheckbox
          v-if="selectionMode"
          :selected="isSelected"
          @change="(shiftKey: boolean) => $emit('toggleSelect', item.path, shiftKey)"
          class="mt-1"
        />
        <UIcon
          name="i-heroicons-document"
          class="text-gray-500 text-xl shrink-0 mt-0.5"
        />
        <div
          class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0"
        >
          <span class="font-semibold break-all sm:truncate">{{ item.name }}</span>
          <span class="text-gray-600 text-xs shrink-0">{{ formatSize(item.size) }}</span>
        </div>
      </div>
      <UButton 
        v-if="!selectionMode"
        @click="$emit('download', item.path)" 
        class="font-bold tracking-wider cursor-pointer shrink-0 w-full sm:w-auto" 
        variant="outline" 
        size="sm" 
        icon="i-heroicons-arrow-down-tray"
      >
        Download
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BrowseItem } from '~~/server/api/share/[token]/browse.get';

defineProps<{
  item: BrowseItem & { isGoUp?: boolean }
  selectionMode?: boolean
  isSelected?: boolean
}>();

defineEmits<{
  navigate: [path: string];
  download: [path: string];
  toggleSelect: [path: string, shiftKey: boolean];
  viewFile: [item: BrowseItem];
}>();

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>