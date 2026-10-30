import {type ContentLakeDocument} from '@repo/content-lake-model'

import {
  classifyFailure,
  classifySample,
  comparableDocument,
  errorVerdict,
  sampleErrorVerdict,
  type SequenceReplay,
  type SubmissionComparison,
  unverifiableStepsOf,
} from './compare'
import {type ContentLakeHttp} from './contentLakeHttp'
import {
  type FailureVerdict,
  type GeneratorFailure,
  type GeneratorReport,
  type GeneratorSample,
  type ReplayableSequence,
  type SampleVerdict,
} from './contracts'
import {
  ACCEPTED,
  errorTypeOf,
  type ModelStep,
  recordedOutcome,
  replayOnModel,
  replayPlan,
  seedRevisionOf,
  type SubmissionOutcome,
} from './modelReplay'
import {
  createIdNamespace,
  documentIdsOf,
  type IdNamespace,
  mapRevisionPreconditions,
  mapStrings,
} from './namespace'

export type DatasetMode = 'create' | 'existing'

export interface Workspace {
  http: ContentLakeHttp
  close: () => Promise<void>
}

interface ReplayProgress {
  replayed: number
  log: (message: string) => void
}

export function documentPrefix(runId: string, sequenceLabel: string): string {
  return `fv-probe-${runId}-${sequenceLabel}-`
}

export async function openWorkspace(http: ContentLakeHttp, mode: DatasetMode): Promise<Workspace> {
  if (mode === 'existing') return {http, close: async () => undefined}
  await http.createDataset()
  let closing: Promise<void> | undefined
  const close = () => {
    closing ??= http.deleteDataset()
    return closing
  }
  try {
    await http.waitForDataset()
  } catch (error) {
    await close()
    throw error
  }
  return {http, close}
}

function withoutSystemFields(document: ContentLakeDocument): ContentLakeDocument {
  const {_rev, _updatedAt, _createdAt, ...content} = document
  return content
}

async function seedLive(
  initial: ContentLakeDocument[],
  namespace: IdNamespace,
  http: ContentLakeHttp,
): Promise<Map<string, string>> {
  const groups = initial.reduce((byRevision, document) => {
    const revision = seedRevisionOf(document)
    return byRevision.set(revision, [...(byRevision.get(revision) ?? []), document])
  }, new Map<string, ContentLakeDocument[]>())
  return [...groups].reduce<Promise<Map<string, string>>>(
    async (previous, [fakeRevision, group]) => {
      const revisions = await previous
      const documents = group.map((document) =>
        mapStrings(withoutSystemFields(document), namespace.toReal),
      )
      const realRevision = await http.seed(documents)
      return new Map([...revisions, [fakeRevision, realRevision]])
    },
    Promise.resolve(new Map()),
  )
}

function realOutcomeOf(status: number, body: unknown): SubmissionOutcome {
  if (status >= 200 && status < 300) return ACCEPTED
  const errorType = errorTypeOf(body)
  return errorType === undefined ? {statusCode: status} : {statusCode: status, errorType}
}

function realDocumentsAsFake(
  documents: Record<string, ContentLakeDocument | null>,
  namespace: IdNamespace,
  revisions: ReadonlyMap<string, string>,
): SubmissionComparison['realDocuments'] {
  const fakeRevisionOf = new Map([...revisions].map(([fake, real]) => [real, fake]))
  return Object.fromEntries(
    namespace.fakeIds.map((fakeId, position) => {
      const real = documents[namespace.realIds[position]] ?? null
      const asFake = mapStrings(mapStrings(real, namespace.toFake), fakeRevisionOf)
      return [fakeId, comparableDocument(asFake)]
    }),
  )
}

async function replayStep(
  sequence: ReplayableSequence,
  step: ModelStep,
  namespace: IdNamespace,
  http: ContentLakeHttp,
  revisions: ReadonlyMap<string, string>,
): Promise<{comparison: SubmissionComparison; revisions: ReadonlyMap<string, string>}> {
  const submission = sequence.submissions[step.submission]
  const request = mapRevisionPreconditions(
    mapStrings(submission.request, namespace.toReal),
    revisions,
  )
  const answer = await http.submit(request)
  const real = realOutcomeOf(answer.status, answer.body)
  const realTransactionId = (answer.body as {transactionId?: unknown} | null)?.transactionId
  const nextRevisions =
    real.statusCode === 200 && typeof realTransactionId === 'string'
      ? new Map([...revisions, [submission.transactionId, realTransactionId]])
      : revisions
  const documents = await http.getDocuments(namespace.realIds)
  return {
    revisions: nextRevisions,
    comparison: {
      submission: step.submission,
      transactionId: step.transactionId,
      recorded: recordedOutcome(submission),
      fake: step.outcome,
      real,
      fakeDocuments: Object.fromEntries(
        Object.entries(step.documents).map(([id, document]) => [id, comparableDocument(document)]),
      ),
      realDocuments: realDocumentsAsFake(documents, namespace, nextRevisions),
    },
  }
}

export async function replaySequenceLive(
  sequence: ReplayableSequence,
  prefix: string,
  http: ContentLakeHttp,
  progress: ReplayProgress,
): Promise<SequenceReplay> {
  const namespace = createIdNamespace(prefix, documentIdsOf(sequence))
  const modelSteps = replayOnModel(sequence, namespace.fakeIds)
  try {
    const seeded = await seedLive(sequence.initial, namespace, http)
    const {comparisons} = await modelSteps.reduce<
      Promise<{revisions: ReadonlyMap<string, string>; comparisons: SubmissionComparison[]}>
    >(
      async (previous, step) => {
        const state = await previous
        const replayed = await replayStep(sequence, step, namespace, http, state.revisions)
        progress.replayed += 1
        return {
          revisions: replayed.revisions,
          comparisons: [...state.comparisons, replayed.comparison],
        }
      },
      Promise.resolve({revisions: seeded, comparisons: []}),
    )
    return {
      plan: replayPlan(sequence),
      comparisons,
      unverifiableSteps: unverifiableStepsOf(sequence),
    }
  } finally {
    await http
      .deleteDocuments(namespace.realIds)
      .catch((error: unknown) =>
        progress.log(`Could not delete ${namespace.prefix}* documents: ${messageOf(error)}`),
      )
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

type Log = (message: string) => void

function noLog(): void {}

export async function verifyFailure(
  failure: GeneratorFailure,
  prefix: string,
  http: ContentLakeHttp,
  log: Log = noLog,
): Promise<FailureVerdict> {
  const progress: ReplayProgress = {replayed: 0, log}
  try {
    return classifyFailure(failure, await replaySequenceLive(failure, prefix, http, progress))
  } catch (error) {
    return errorVerdict(failure.signature, messageOf(error), progress.replayed)
  }
}

export async function verifySample(
  sample: GeneratorSample,
  prefix: string,
  http: ContentLakeHttp,
  log: Log = noLog,
): Promise<SampleVerdict> {
  const progress: ReplayProgress = {replayed: 0, log}
  try {
    return classifySample(sample, await replaySequenceLive(sample, prefix, http, progress))
  } catch (error) {
    return sampleErrorVerdict(sample, messageOf(error), progress.replayed)
  }
}

export function verifyFailures(
  report: GeneratorReport,
  http: ContentLakeHttp,
  runId: string,
  log: Log = noLog,
): Promise<FailureVerdict[]> {
  return report.failures.reduce<Promise<FailureVerdict[]>>(async (previous, failure, index) => {
    const verdicts = await previous
    const verdict = await verifyFailure(failure, documentPrefix(runId, `f${index}`), http, log)
    log(`[${verdict.verdict}] ${failure.signature}`)
    return [...verdicts, verdict]
  }, Promise.resolve([]))
}

export function verifySamples(
  samples: GeneratorSample[],
  http: ContentLakeHttp,
  runId: string,
  log: Log = noLog,
): Promise<SampleVerdict[]> {
  return samples.reduce<Promise<SampleVerdict[]>>(async (previous, sample, index) => {
    const verdicts = await previous
    const verdict = await verifySample(sample, documentPrefix(runId, `s${index}`), http, log)
    log(
      `[${verdict.verdict}] sample seed ${sample.seed} run ${sample.runIndex}${verdict.fakeSignature ? `: ${verdict.fakeSignature}` : ''}`,
    )
    return [...verdicts, verdict]
  }, Promise.resolve([]))
}

export interface ReportVerdicts {
  verdicts: FailureVerdict[]
  samples?: SampleVerdict[]
}

/** Failures first, then samples, one sequence at a time to keep staging traffic serial. */
export async function verifyReport(
  report: GeneratorReport,
  http: ContentLakeHttp,
  runId: string,
  log: Log = noLog,
): Promise<ReportVerdicts> {
  const verdicts = await verifyFailures(report, http, runId, log)
  if (report.samples === undefined) return {verdicts}
  return {verdicts, samples: await verifySamples(report.samples, http, runId, log)}
}

export function workspaceErrorResults(report: GeneratorReport, error: unknown): ReportVerdicts {
  const reason = `could not prepare the dataset: ${messageOf(error)}`
  const verdicts = report.failures.map((failure) => errorVerdict(failure.signature, reason, 0))
  if (report.samples === undefined) return {verdicts}
  return {verdicts, samples: report.samples.map((sample) => sampleErrorVerdict(sample, reason, 0))}
}
