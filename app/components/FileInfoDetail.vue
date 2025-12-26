<template>
  <div class="flex flex-col sm:flex-row sm:justify-between gap-2">
    <span class="text-gray-400 font-bold text-sm sm:mr-10">{{ label }}</span>
    <span
      class="font-mono font-semibold text-sm sm:text-right"
      :class="{
        'text-gray-500': darker,
        'wrap-break-word': breakApart
      }">
      {{ value }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  darker?: boolean
  breakApart?: boolean
}>();
</script>
