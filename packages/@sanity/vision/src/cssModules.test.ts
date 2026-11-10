import {globSync, readFileSync} from 'node:fs'
import path from 'node:path'

import {cssModulesPattern} from '@repo/css-modules-kit'
import {transform} from 'lightningcss'
import {describe, expect, test} from 'vitest'

const packageRoot = path.resolve(import.meta.dirname, '..')
const modules = globSync('src/**/*.module.css', {cwd: packageRoot}).toSorted()

describe.each(modules)('%s', (file) => {
  // What the package build exports for it: `@tsdown/css` compiles it with Lightning CSS, and only
  // the `cssModules` pattern of the default scoping options set
  const {exports} = transform({
    filename: file,
    code: readFileSync(path.join(packageRoot, file)),
    cssModules: {pattern: cssModulesPattern},
  })
  // A class that `composes` others exports their names after its own, as the build and Vite join them
  const names = Object.fromEntries(
    Object.entries(exports ?? {}).map(([key, {name, composes}]) => [
      key,
      [name, ...composes.map((composed) => composed.name)].join(' '),
    ]),
  )

  test('its typings declare exactly the names Lightning CSS exports', () => {
    const typings = readFileSync(path.join(packageRoot, 'generated', `${file}.d.ts`), 'utf8')
    const declared = new Set(
      Array.from(typings.matchAll(/^export \{ \w+ as '([^']+)' \};$/gm), ([, name]) => name),
    )
    expect([...declared].toSorted()).toEqual(Object.keys(names).toSorted())
  })

  test('Vite compiles it to the class names of the package build', async () => {
    // Imported at runtime, so vitest compiles it with the `css` options of vitest.config.mts
    const {default: _classes, ...compiled}: Record<string, unknown> = await import(
      path.join(packageRoot, file)
    )
    expect(compiled).toEqual(names)
  })
})
