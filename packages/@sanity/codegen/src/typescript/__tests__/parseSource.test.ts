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
})
