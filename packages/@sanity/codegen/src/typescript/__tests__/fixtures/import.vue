<script setup lang="ts">
import groq from 'groq'
const query = groq`*[_type == "myType"]`
</script>

<template>
  <MyComponent>
    <div>{{ query }}</div>
  </MyComponent>
</template>
