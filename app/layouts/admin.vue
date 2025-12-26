<template>
  <div class="min-h-screen">
    <nav class="border-b border-gray-800 bg-gray-950">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-bold tracking-wider">filearr</h1>
            <span class="text-gray-600">|</span>
            <span class="text-gray-400 text-sm">admin</span>
          </div>
          <UButton
            @click="handleLogout"
            variant="ghost"
            color="gray"
            icon="heroicons:arrow-right-on-rectangle"
          >
            Logout
          </UButton>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

// Check auth on mount
onMounted(async () => {
  await authStore.checkAuth()
  if (!authStore.isLoggedIn) {
    router.push('/login')
  }
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>
