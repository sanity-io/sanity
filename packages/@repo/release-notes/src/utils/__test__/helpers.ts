import {readFile} from 'node:fs/promises'

export function readFixture(name: string) {
  return readFile(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8')
}

export function keyGenerator() {
  let currentKey = 0
  return () => {
    // deterministic keygenerator for tests
    return `key-${currentKey++}`
  }
}
