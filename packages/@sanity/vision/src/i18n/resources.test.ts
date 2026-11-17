import {readdirSync, readFileSync} from 'node:fs'
import {dirname, join, relative} from 'node:path'
import {fileURLToPath} from 'node:url'

import {describe, expect, it} from 'vitest'

import visionLocaleStrings from './resources'

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')

// `t('some.key')`, `t("some.key")` and `i18n.t('some.key', {...})`; dynamic keys are not literals
const TRANSLATION_CALL = /\bt\(\s*(['"])([^'"]+)\1/g

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return listSourceFiles(path)
    }
    const isSource = /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
    return isSource ? [path] : []
  })
}

describe('vision locale resources', () => {
  it('define every key the source code translates', () => {
    const missing: string[] = []

    for (const file of listSourceFiles(SRC_DIR)) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(TRANSLATION_CALL)) {
        const key = match[2]
        if (!(key in visionLocaleStrings)) {
          missing.push(`${relative(SRC_DIR, file)}: ${key}`)
        }
      }
    }

    expect(missing).toEqual([])
  })
})
