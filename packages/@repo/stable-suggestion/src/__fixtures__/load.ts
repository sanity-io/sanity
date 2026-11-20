import {readFileSync} from 'node:fs'

import {type History} from '../types'

function readJson<Shape>(fileName: string): Shape {
  return JSON.parse(readFileSync(new URL(fileName, import.meta.url), 'utf8')) as Shape
}

export function loadHistoryFixture(): History {
  return readJson<History>('./history.json')
}

export function loadRawFixture<Shape>(
  name: 'npm-packument' | 'npm-downloads' | 'radar-raw' | 'github-runs' | 'github-issues',
): Shape {
  return readJson<Shape>(`./${name}.json`)
}
