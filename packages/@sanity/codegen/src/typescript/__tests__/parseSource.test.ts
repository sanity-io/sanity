import {describe, expect, test} from 'vitest'

import {parseSourceFile} from '../parseSource'

describe('parseSource', () => {
  test('should parse astro', () => {
    const source = `
---
import Layout from '../layouts/Layout.astro';
import { project_dir } from '../libs/utils';


const proj = "10_prerender"
const render_time = new Date()
export const prerender = true
---

<Layout title="Prerendered">
  <main>
    <h1>Prerendered</h1>
      <p>This page was prerendered at {render_time.toISOString()}</p>
  </main>
</Layout>
    `

    const parsed = parseSourceFile(source, 'foo.astro', {})

    expect(parsed.type).toBe('File')
    expect(parsed.program.body.length).toBe(5)
  })
  test('should parse vue', () => {
    const source = `
<script setup lang="ts">
import groq from 'groq'
const query = groq('*[_type == "myType"]')
</script>

<template>
  <MyComponent>
    <div>{{ query }}</div>
  </MyComponent>
</template>
    `

    const parsed = parseSourceFile(source, 'foo.vue', {})

    expect(parsed.type).toBe('File')
    expect(parsed.program.body.length).toBe(2)
  })
  test('should parse vue: with complex generics', () => {
    const source = `
<script generic="T extends string | Record<string, unknown>" lang="ts" setup>
import groq from 'groq'
const query = groq('*[_type == "myType"]')
</script>

<template>
  <MyComponent>
    <div>{{ query }}</div>
  </MyComponent>
</template>
    `

    const parsed = parseSourceFile(source, 'foo.vue', {})

    expect(parsed.type).toBe('File')
    expect(parsed.program.body.length).toBe(2)
  })
  test('should parse vue: with multiple script tags', () => {
    const source = `
<script setup lang="ts">
import groq from 'groq'
const query = groq('*[_type == "myType"]')
</script>

<template>
  <MyComponent>
    <div>{{ query }}</div>
  </MyComponent>
</template>

<script>
export default {
  inheritAttrs: false,
}
</script>
    `

    const parsed = parseSourceFile(source, 'foo.vue', {})

    expect(parsed.type).toBe('File')
    expect(parsed.program.body.length).toBe(3)
  })
})
