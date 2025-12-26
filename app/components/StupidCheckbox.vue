<template>
  <button @click="(e: MouseEvent) => $emit('change', e.shiftKey)" :class="`cursor-pointer rounded-sm ring ring-inset ring-accented overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary size-4 ${$props.class || ''}`" role="checkbox" type="button" :aria-checked="selected ? 'true': 'false'" aria-required="false">
    <span v-if="selected" style="pointer-events: none;" class="flex items-center justify-center size-full text-inverted bg-primary">
      <Icon class="shrink-0 size-full" name="i-lucide-check" aria-hidden="true" />
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  selected: boolean
  class?: string
}>()

defineEmits<{
  change: [shiftKey: boolean];
}>()
</script>