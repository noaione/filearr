<template>
  <div class="flex items-center justify-center min-h-screen p-4">
    <UCard class="w-full max-w-md bg-gray-950 border border-gray-800">
      <template #header>
        <div class="text-center">
          <h2 class="text-2xl font-bold tracking-wider">filearr</h2>
          <p class="text-gray-500 text-sm mt-1">Admin Login</p>
        </div>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <UFormField label="Username" required>
          <UInput
            v-model="username"
            type="text"
            placeholder="admin"
            autofocus
            autocomplete="username"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" required>
          <UInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <div v-if="error" class="text-red-500 text-sm mt-2">
          {{ error }}
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          color="secondary"
          class="mt-4"
          :loading="loading"
          :disabled="!username || !password"
        >
          Login
        </UButton>
      </form>

      <template #footer>
        <div class="text-center">
          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            size="sm"
            icon="heroicons:arrow-left"
          >
            Back to Home
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

// Check if already logged in
onMounted(async () => {
  await authStore.checkAuth()
  if (authStore.isLoggedIn) {
    router.push('/admin')
  }
})

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  const result = await authStore.login(username.value, password.value)

  if (result.success) {
    router.push('/admin')
  } else {
    error.value = result.error || 'Login failed'
  }

  loading.value = false
}
</script>
