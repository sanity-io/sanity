import {existsSync, readdirSync, readFileSync} from 'node:fs'
import path from 'node:path'

import {
  CATALOGUE_SUITE_IDS,
  type CatalogueEntryMetadata,
  type CatalogueSuiteId,
} from '@repo/utils/engine-confidence'

import {readJsonFile} from '../config'

export interface CatalogueEntry {
  metadata: CatalogueEntryMetadata
  patchPath: string
  witnessPatchPath?: string
}

const SEVERITIES = ['S1', 'S2', 'S3']

/** Paths the catalogue pull request check watches; every patch must stay inside them. */
export const CATALOGUE_CHECK_PATH_PREFIXES = [
  'engine-confidence/catalogue/',
  'packages/@sanity/mutator/src/',
  'packages/sanity/src/core/store/document/',
  'packages/sanity/src/core/form/',
]

/** Files the unified diff in `patchText` touches, repo-relative. */
export function filesInPatch(patchText: string): string[] {
  return patchText
    .split('\n')
    .filter((line) => line.startsWith('+++ b/'))
    .map((line) => line.slice('+++ b/'.length))
}

export function filesInPatchFile(patchPath: string): string[] {
  return filesInPatch(readFileSync(patchPath, 'utf8'))
}

function isSuiteId(value: unknown): value is CatalogueSuiteId {
  return CATALOGUE_SUITE_IDS.some((suite) => suite === value)
}

function isSuiteList(value: unknown): boolean {
  return Array.isArray(value) && value.every(isSuiteId)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/** Human-readable problems with a sidecar; empty when it is a valid `CatalogueEntryMetadata`. */
export function sidecarProblems(raw: unknown): string[] {
  const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const requiredStrings = [
    'id',
    'title',
    'failureClass',
    'source',
    'userVisibleEffect',
    'addedOn',
  ].filter((key) => typeof record[key] !== 'string' || record[key] === '')
  const suiteListProblems = ['notApplicableSuites', 'expectedCaughtBy'].flatMap((key) =>
    isSuiteList(record[key]) ? [] : [`${key} must be a list of known suite ids`],
  )
  return [
    ...requiredStrings.map((key) => `${key} must be a non-empty string`),
    ...(typeof record.id === 'string' && /^ENG-\d{3}$/.test(record.id)
      ? []
      : ['id must look like ENG-001']),
    ...(SEVERITIES.includes(record.severity as string) ? [] : ['severity must be S1, S2 or S3']),
    ...(isStringArray(record.filesTouched) && record.filesTouched.length > 0
      ? []
      : ['filesTouched must list at least one file']),
    ...suiteListProblems,
    ...(record.retiredOn !== undefined && typeof record.retiredReason !== 'string'
      ? ['retiredOn needs a retiredReason']
      : []),
  ]
}

export function loadCatalogueEntries(catalogueDirectory: string): CatalogueEntry[] {
  return readdirSync(catalogueDirectory)
    .filter((fileName) => fileName.endsWith('.json'))
    .toSorted()
    .map((fileName) => {
      const metadata = readJsonFile<CatalogueEntryMetadata>(path.join(catalogueDirectory, fileName))
      const baseName = fileName.slice(0, -'.json'.length)
      const witnessPatchPath = path.join(
        catalogueDirectory,
        'witness',
        `${metadata.id}.witness.patch`,
      )
      return {
        metadata,
        patchPath: path.join(catalogueDirectory, `${baseName}.patch`),
        ...(existsSync(witnessPatchPath) ? {witnessPatchPath} : {}),
      }
    })
}

export function isActive(entry: CatalogueEntry): boolean {
  return entry.metadata.retiredOn === undefined
}
