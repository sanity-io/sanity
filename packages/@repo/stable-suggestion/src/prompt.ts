import {readFileSync} from 'node:fs'

import {PACKAGE_NAME, SHORTLIST_SIZE} from './config'
import {EVIDENCE_SECTIONS, type EvidenceSection} from './evidenceSections'
import {daysBetween} from './time'
import {type Evaluation, type Evidence} from './types'

export const GENERAL_CONCERN = 'general'

export interface Prompt {
  system: string
  user: string
  schema: Record<string, unknown>
}

const SYSTEM_PROMPT_URL = new URL('../prompts/system.md', import.meta.url)

export function loadSystemPrompt(): string {
  return readFileSync(SYSTEM_PROMPT_URL, 'utf8')
    .replaceAll('{{packageName}}', PACKAGE_NAME)
    .replaceAll('{{shortlistSize}}', String(SHORTLIST_SIZE))
    .trim()
}

function buildSchema(eligible: string[], candidateVersions: string[]): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['recommendation', 'shortlist', 'headline', 'rationale', 'concerns', 'confidence'],
    properties: {
      recommendation: {type: 'string', enum: ['promote', 'hold']},
      shortlist: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['version', 'reason'],
          properties: {version: {type: 'string', enum: eligible}, reason: {type: 'string'}},
        },
      },
      headline: {type: 'string'},
      rationale: {type: 'string'},
      concerns: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['version', 'note'],
          properties: {
            version: {type: 'string', enum: [...candidateVersions, GENERAL_CONCERN]},
            note: {type: 'string'},
          },
        },
      },
      confidence: {type: 'string', enum: ['low', 'medium', 'high']},
    },
  }
}

export function buildPrompt(
  evidence: Evidence,
  evaluation: Evaluation,
  sections: EvidenceSection[] = EVIDENCE_SECTIONS,
): Prompt {
  const user = {
    asOf: evaluation.asOf,
    currentStable: {
      version: evaluation.currentStable,
      ageDays:
        evaluation.currentStableSince === null
          ? null
          : daysBetween(evaluation.currentStableSince, evaluation.asOf),
    },
    latest: evaluation.latest,
    dataStatus: {
      regressions: evidence.regressions.status,
      sqrl: evidence.sqrl.status,
      issues: evidence.issues.status,
      downloads: evidence.downloads.status,
    },
    eligible: evaluation.eligible,
    deterministicShortlist: evaluation.shortlist,
    ...Object.fromEntries(
      sections.map((section) => [section.key, section.build(evidence, evaluation)]),
    ),
  }
  return {
    system: loadSystemPrompt(),
    user: JSON.stringify(user),
    schema: buildSchema(
      evaluation.eligible,
      evaluation.candidates.map((candidate) => candidate.version),
    ),
  }
}
