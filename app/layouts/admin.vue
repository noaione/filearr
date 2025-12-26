<template>
  <div class="min-h-dvh">
    <nav class="border-b border-gray-800 bg-gray-950">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center align-middle space-x-4">
            <h1 class="text-xl font-bold tracking-wider">filearr <span class="text-gray-600 text-sm font-semibold">| <span class="text-gray-400">admin</span></span></h1>
          </div>
          <UButton
            @click="handleLogout"
            variant="ghost"
            color="error"
            icon="heroicons:arrow-right-on-rectangle"
          >
            Logout
          </UButton>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 pt-4 pb-8">
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
