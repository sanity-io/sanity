export type ReviewRisk = 'low' | 'medium' | 'high'

export interface ReviewResult {
  verdict: {
    risk: ReviewRisk
    summary: string
  }
  documents: Array<{
    documentId: string
    commentary: string
  }>
}

const VALID_RISKS: readonly string[] = ['low', 'medium', 'high']

function isReviewRisk(value: unknown): value is ReviewRisk {
  return typeof value === 'string' && VALID_RISKS.includes(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function parseDocumentEntry(entry: unknown): ReviewResult['documents'][number] {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error('Expected each documents entry to be an object')
  }
  const candidate = entry as Record<string, unknown>
  if (!isNonEmptyString(candidate.documentId)) {
    throw new Error('Expected documents[*].documentId to be a non-empty string')
  }
  if (!isNonEmptyString(candidate.commentary)) {
    throw new Error('Expected documents[*].commentary to be a non-empty string')
  }
  return {documentId: candidate.documentId, commentary: candidate.commentary}
}

export function parseReviewResult(raw: unknown): ReviewResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Expected review result to be an object')
  }
  const candidate = raw as Record<string, unknown>

  if (typeof candidate.verdict !== 'object' || candidate.verdict === null) {
    throw new Error('Expected review result to have a verdict object')
  }
  const verdict = candidate.verdict as Record<string, unknown>

  if (!isReviewRisk(verdict.risk)) {
    throw new Error('Expected verdict.risk to be "low", "medium", or "high"')
  }
  if (!isNonEmptyString(verdict.summary)) {
    throw new Error('Expected verdict.summary to be a non-empty string')
  }

  if (!Array.isArray(candidate.documents)) {
    throw new Error('Expected review result to have a documents array')
  }

  return {
    verdict: {risk: verdict.risk, summary: verdict.summary},
    documents: candidate.documents.map(parseDocumentEntry),
  }
}
