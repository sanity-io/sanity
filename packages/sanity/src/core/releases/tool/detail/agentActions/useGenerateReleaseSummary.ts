import {type ReleaseDocument} from '@sanity/client'
import {useCallback, useState} from 'react'

import {useClient} from '../../../../hooks/useClient'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleaseSettings} from '../../../store/useReleaseSettings'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {buildChangesQuery, toError} from './agentActionUtils'
import {useReleaseAgentTextAction} from './useReleaseAgentTextAction'

const CHANGES_PREAMBLE = [
  '$changes is an array of documents that this release modifies.',
  'Each element has _type, before (the published version, or null if new), and after (the version in this release).',
  'If after._system.delete is true, the document will be unpublished.',
].join('\n')

const AUDIENCE_AND_JARGON_RULES = [
  'Audience: the reader is a non-technical editor browsing a release summary. Write in plain, everyday language.',
  '',
  'Strict content rules:',
  '- Refer to each document by a human-readable handle. Prefer its `title` field, falling back to `name`, `displayName`, `label`, or similar human-facing fields if `title` is absent.',
  '- If no human-readable handle exists, describe the document by what it represents in everyday words (for example, "an author", "a page", "a blog post"). Do not name the schema type literally (no `manyEditors`, `markdownTest`, etc.).',
  '- Never include document IDs, version IDs, draft IDs, revision IDs, or any value that looks like a UUID or a path like "versions.X.Y".',
  '- Never include asset references such as `image-…-jpg` or `file-…`. Say "an image", "a photo", "an attached file" instead.',
  '- Never expose internal/system fields. Skip anything whose name starts with `_` (such as `_id`, `_type`, `_rev`, `_system.delete`, `_system.base`).',
  '- Do not quote technical field names like `pt1`, `bestFriend`, `slug.current`. If you need to mention what changed inside a document, describe it in human terms (for example, "the bio was updated" or "a new co-author was added").',
  '- Do not quote raw values for technical fields (slug strings, dataset IDs, release bundle names, hash-like identifiers).',
  '- Avoid words like "schema", "field", "object", "asset reference", "JSON", "array" in your output.',
].join('\n')

const SUMMARY_INSTRUCTION = [
  CHANGES_PREAMBLE,
  '',
  AUDIENCE_AND_JARGON_RULES,
  '',
  'Produce a release summary in two parts:',
  '',
  '1. One sentence naming what this release achieves — what readers will see. Avoid count-and-mechanics phrasing like "X documents were updated".',
  '',
  '2. Then 2-4 bullet lines, each starting with "- ". Each names the document by its human-readable handle and states what changed (added, edited, or unpublished, plus what is different in human terms). Skip metadata churn.',
  '',
  'Plain text. No markdown headings. Separate the overview sentence from the bullets with a blank line.',
].join('\n')

const TEMPLATE_OUTPUT_RULES = [
  'Respond as a JSON object with the shape: {"sections": [{"body": string}, ...]}.',
  '',
  'For each title in $sectionTitles, in the same order, produce one section. The studio renders the title itself separately, so write only the section content — never the title, never a heading.',
  '',
  'Each section content must:',
  '- Start with the first real sentence of substantive content. No openers, labels, mini-headings, colon lead-ins, or preamble lines such as "New in this release", "Here\'s what\'s new", "Overview", "Summary", or "What changed".',
  '- Be plain text. No markdown headings of any kind.',
  '- Be one to three short sentences, or two to four short bullet lines starting with "- ". Never combine prose and bullets in the same section.',
  '- Stick to plain declarative statements. Do not elaborate, restate the same change twice, add reassurance or framing, or wrap up.',
  '- Skip anything the reader can already infer from the title or from another section.',
  '- Stop as soon as the substantive content is covered. No closing sentence, no "in summary", no "overall".',
  '',
  'If a section has no relevant content for this release, use a short honest line such as "No notable changes."',
].join('\n')

const SECTION_GUIDANCE_PARAGRAPH = [
  "$sectionGuidance is a JSON array of author instructions that you MUST follow when writing the corresponding section. Each entry has `title` (matches one of the titles in $sectionTitles) and `instructions` (the author's binding guidance for that section). Apply each entry's instructions when generating the `body` for the matching title — including what to emphasize, what to omit, the voice to use, and the structure to follow. If a title from $sectionTitles is not present in $sectionGuidance, no specific guidance applies; generate that body using only the general rules above.",
].join('\n')

function buildTemplateSummaryInstruction(includesGuidance: boolean): string {
  const sectionTitlesParagraph =
    '$sectionTitles is a JSON array of section titles authored by the project owner.'
  return [
    CHANGES_PREAMBLE,
    '',
    AUDIENCE_AND_JARGON_RULES,
    '',
    sectionTitlesParagraph,
    ...(includesGuidance ? ['', SECTION_GUIDANCE_PARAGRAPH] : []),
    '',
    TEMPLATE_OUTPUT_RULES,
  ].join('\n')
}

const CHANGES_QUERY = buildChangesQuery()
const MISSING_SECTION_PLACEHOLDER = 'No content generated.'

interface TemplateSummaryResult {
  sections: Array<{body: string}>
}

interface SectionGuidanceEntry {
  title: string
  instructions: string
}

function parseTemplateSummaryResult(input: unknown): TemplateSummaryResult {
  if (typeof input !== 'object' || input === null) {
    throw new Error('AI response was not an object')
  }
  const maybeSections = (input as {sections?: unknown}).sections
  if (!Array.isArray(maybeSections)) {
    throw new Error('AI response missing `sections` array')
  }
  const sections = maybeSections.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`Section ${index} is not an object`)
    }
    const body = (entry as {body?: unknown}).body
    return {body: typeof body === 'string' ? body : ''}
  })
  return {sections}
}

function composeSectionedDescription(titles: string[], sections: Array<{body: string}>): string {
  return titles
    .map((title, index) => {
      const rawBody = sections[index]?.body?.trim() ?? ''
      const safeBody = rawBody.length > 0 ? rawBody : MISSING_SECTION_PLACEHOLDER
      return `${title}\n\n${safeBody}`
    })
    .join('\n\n')
}

function mergeSummaryIntoMetadata(
  metadata: ReleaseDocument['metadata'],
  generated: string,
): ReleaseDocument['metadata'] {
  const merged = metadata.description ? `${metadata.description}\n\n${generated}` : generated
  return {...metadata, description: merged}
}

interface UseTemplateSummaryGeneratorOptions {
  release: ReleaseDocument
  titles: string[]
  guidance: SectionGuidanceEntry[]
}

interface UseTemplateSummaryGeneratorResult {
  generate: () => Promise<void>
  isGenerating: boolean
  error: Error | null
}

function useTemplateSummaryGenerator(
  options: UseTemplateSummaryGeneratorOptions,
): UseTemplateSummaryGeneratorResult {
  const {release, titles, guidance} = options
  const client = useClient({apiVersion: 'vX'})
  const {updateRelease} = useReleaseOperations()
  const releaseName = getReleaseIdFromReleaseDocumentId(release._id)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)

    const hasGuidance = guidance.length > 0
    const sectionTitlesParamValue = JSON.stringify(titles)
    const guidanceParam = hasGuidance
      ? {
          sectionGuidance: {
            type: 'constant' as const,
            value: JSON.stringify(guidance),
          },
        }
      : ({} as Record<string, never>)

    const run = async () => {
      const response = await client.agent.action.prompt<TemplateSummaryResult>({
        format: 'json',
        instruction: buildTemplateSummaryInstruction(hasGuidance),
        instructionParams: {
          changes: {
            type: 'groq',
            perspective: 'raw',
            query: CHANGES_QUERY,
            params: {releaseName},
          },
          sectionTitles: {type: 'constant', value: sectionTitlesParamValue},
          ...guidanceParam,
        },
      })
      const result = parseTemplateSummaryResult(response)
      const composed = composeSectionedDescription(titles, result.sections)
      if (composed.length === 0) return
      await updateRelease({
        ...release,
        metadata: mergeSummaryIntoMetadata(release.metadata, composed),
      })
    }

    try {
      await run()
    } catch (caughtError) {
      setError(toError(caughtError))
    }

    setIsGenerating(false)
  }, [client, guidance, release, releaseName, titles, updateRelease])

  return {generate, isGenerating, error}
}

/**
 * Branches on whether the project has a release template configured: with titles,
 * returns a JSON-mode generator that fills each section's body; without titles,
 * falls back to a free-form text generator.
 */
export function useGenerateReleaseSummary(release: ReleaseDocument) {
  const {descriptionSections} = useReleaseSettings()
  const sectionInputs = descriptionSections
    .map((section) => ({
      title: section.title.trim(),
      hint: (section.hint ?? '').trim(),
    }))
    .filter((entry) => entry.title.length > 0)
  const titles = sectionInputs.map((entry) => entry.title)
  const guidance: SectionGuidanceEntry[] = sectionInputs
    .filter((entry) => entry.hint.length > 0)
    .map((entry) => ({title: entry.title, instructions: entry.hint}))
  const hasTitles = titles.length > 0

  const freeFormAction = useReleaseAgentTextAction({
    release,
    instruction: SUMMARY_INSTRUCTION,
    mergeIntoMetadata: mergeSummaryIntoMetadata,
  })

  const templateAction = useTemplateSummaryGenerator({release, titles, guidance})

  return hasTitles ? templateAction : freeFormAction
}
