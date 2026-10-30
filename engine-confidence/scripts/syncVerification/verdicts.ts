import {type Seam} from './generatorReport'

export type Verdict = 'confirmed' | 'fake-mismatch' | 'assumed' | 'error'

export interface VerdictDifference {
  submission: number
  transactionId: string
  field: 'statusCode' | 'errorType' | 'document'
  documentId?: string
  fake: unknown
  real: unknown
}

export interface FailureVerdict {
  signature: string
  verdict: Verdict
  summary: string
  differences: VerdictDifference[]
  replayed: number
}

export interface VerdictsFile {
  version: 1
  commit: string
  seam: Seam
  verdicts: FailureVerdict[]
}
