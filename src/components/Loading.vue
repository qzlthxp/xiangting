<template>
  <p>{{ msg || 'loading...' }}</p>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  msg?: string
}>()
console.log(props)
</script>

<style lang="scss" scoped></style>
