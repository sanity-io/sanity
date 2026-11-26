import {ISSUE_TITLE_LIMIT} from './config'
import {type Candidate, type Evaluation, type Evidence} from './types'

export interface EvidenceSection {
  key: string
  build: (evidence: Evidence, evaluation: Evaluation) => unknown
}

function perCandidate<Block>(
  evaluation: Evaluation,
  pick: (candidate: Candidate) => Block,
): (Block & {version: string})[] {
  return evaluation.candidates.map((candidate) => ({
    version: candidate.version,
    ...pick(candidate),
  }))
}

function truncateTitle(title: string): string {
  return title.slice(0, ISSUE_TITLE_LIMIT)
}

function collectIssueTitles(evidence: Evidence, evaluation: Evaluation) {
  if (evidence.issues.status === 'unavailable') return []
  const mentioned = new Set(
    evaluation.candidates.flatMap((candidate) => candidate.openIssueNumbers),
  )
  return evidence.issues.data
    .filter((issue) => mentioned.has(issue.number))
    .map((issue) => ({number: issue.number, title: truncateTitle(issue.title)}))
}

export const EVIDENCE_SECTIONS: EvidenceSection[] = [
  {
    key: 'soak',
    build: (_evidence, evaluation) =>
      perCandidate(evaluation, (candidate) => ({
        ageDays: candidate.ageDays,
        urgentReason: candidate.urgentReason ?? null,
      })),
  },
  {
    key: 'hardRules',
    build: (_evidence, evaluation) =>
      perCandidate(evaluation, (candidate) => ({hard: candidate.hard})),
  },
  {
    key: 'softFlags',
    build: (_evidence, evaluation) =>
      perCandidate(evaluation, (candidate) => ({soft: candidate.soft})),
  },
  {
    key: 'sqrl',
    build: (_evidence, evaluation) =>
      perCandidate(evaluation, (candidate) => ({
        sqrl: candidate.sqrl && {
          score: candidate.sqrl.score,
          regressedInputs: candidate.sqrl.regressedInputs,
          reliabilityEvents: candidate.sqrl.reliabilityEvents,
        },
        sqrlBaseline: candidate.sqrlBaseline,
      })),
  },
  {
    key: 'issues',
    build: (evidence, evaluation) => ({
      openIssueNumbers: perCandidate(evaluation, (candidate) => ({
        openIssueNumbers: candidate.openIssueNumbers,
      })),
      titles: collectIssueTitles(evidence, evaluation),
    }),
  },
  {
    key: 'adoption',
    build: (_evidence, evaluation) =>
      perCandidate(evaluation, (candidate) => ({adoptionShare: candidate.adoptionShare})),
  },
  {
    key: 'regressions',
    build: (_evidence, evaluation) => evaluation.stableAtRisk.map((verdict) => verdict.detail),
  },
  {
    key: 'stableSplit',
    build: (_evidence, evaluation) => evaluation.stableSplit ?? null,
  },
  {
    key: 'issuesInRange',
    build: (_evidence, evaluation) =>
      evaluation.openIssuesInRange.map((issue) => ({
        number: issue.number,
        title: truncateTitle(issue.title),
        versions: issue.versions,
      })),
  },
]
