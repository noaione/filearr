<template>
  <div class="flex items-center justify-center min-h-screen p-4">
    <div class="text-center space-y-8 max-w-2xl">
      <div class="space-y-4">
        <h1 class="text-6xl font-bold tracking-wider">filearr</h1>
        <p class="text-gray-400 text-sm">stupidly simple file sharing server</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <UButton
          to="/login"
          size="lg"
          color="neutral"
          variant="outline"
          label="Admin Login"
          icon="i-heroicons-arrow-right-on-rectangle"
        />
        <UButton
          to="https://github.com/noaione/filearr"
          target="_blank"
          size="lg"
          color="neutral"
          variant="ghost"
          label="GitHub"
          icon="i-simple-icons-github"
        />
      </div>

      <div class="text-xs text-gray-600 mt-12">
        <p>v1.0.0</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>
