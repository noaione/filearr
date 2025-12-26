<template>
  <div class="min-w-96 min-h-52 font-mono-simple h-full w-full flex items-start justify-start bg-gray-900 text-white">
    <div class="flex w-full h-full">
      <div class="flex flex-col w-full h-full p-10 justify-start items-start">
        <h1 class="text-4xl font-extrabold text-left font-mono-simple"> {{ $config.public.app.name }} </h1>
        <p class="font-semibold text-gray-400 mt-4 font-mono-simple"> {{ $config.public.app.description }} </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-mono-simple {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace;
}
</style>