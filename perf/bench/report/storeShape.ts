import {
  type BenchRunDocument,
  type ResourceSide,
  type ScenarioReport,
  type SideMetric,
} from './types'

/**
 * Reshape a BenchRunDocument for storage so the metrics studio
 * (dev/metrics-studio) can declare and render it:
 * - each per-session sample array is wrapped in a keyed `{samples}` object —
 *   nested arrays survive the API round-trip (verified), but a studio schema
 *   cannot declare an array-of-arrays and unkeyed items render with warnings
 * - `byClass` is an arbitrary-key record, which a studio schema can't
 *   declare either — stored as a keyed `{endpointClass, count}` array
 * - every object in an array gets a `_key`
 * - `git.commit` is added as a weak reference to the run's `gitCommit`
 *   document (dev/metrics-studio's git-history sync), derived from the
 *   deterministic id `gitCommit-<sha>` — no lookup. Weak because the target
 *   may not exist: PR runs measure branch commits that are never synced, and
 *   a fresh main run can beat the sync. `git.sha` stays the source of truth.
 *
 * The artifact/report JSON keeps the raw shape; only the stored document
 * differs. The metrics-studio schema mirrors THIS shape — keep them in sync.
 */
export function toStorableRun(document: BenchRunDocument) {
  const isFullSha = /^[0-9a-f]{40}$/.test(document.git.sha)
  return {
    ...document,
    git: {
      ...document.git,
      ...(isFullSha
        ? {commit: {_type: 'reference', _ref: `gitCommit-${document.git.sha}`, _weak: true}}
        : {}),
    },
    scenarios: document.scenarios.map((scenario) => ({
      ...scenario,
      _key: `${scenario.mode ?? scenario.kind}-${scenario.scenario}`,
      metrics: scenario.metrics.map((metric, index) => ({
        ...metric,
        _key: `metric-${index}`,
        experiment: toStorableSide(metric.experiment),
        ...(metric.reference ? {reference: toStorableSide(metric.reference)} : {}),
      })),
      failures: scenario.failures.map((failure, index) => ({...failure, _key: `failure-${index}`})),
      loafAttribution: scenario.loafAttribution.map((entry, index) => ({
        ...entry,
        _key: `loaf-${index}`,
      })),
      ...(scenario.clsAttribution
        ? {
            clsAttribution: scenario.clsAttribution.map((entry, index) => ({
              ...entry,
              _key: `shift-${index}`,
            })),
          }
        : {}),
      ...(scenario.resources ? {resources: toStorableResources(scenario.resources)} : {}),
      ...(scenario.soak
        ? {
            soak: {
              ...scenario.soak,
              samples: scenario.soak.samples.map((sample) => ({
                ...sample,
                _key: `minute-${sample.minute}`,
              })),
            },
          }
        : {}),
    })),
  }
}

function toStorableSide(side: SideMetric) {
  return {
    ...side,
    sessions: side.sessions.map((samples, index) => ({_key: `session-${index}`, samples})),
  }
}

function toStorableResources(resources: NonNullable<ScenarioReport['resources']>) {
  return {
    experiment: toStorableResourceSide(resources.experiment),
    ...(resources.reference ? {reference: toStorableResourceSide(resources.reference)} : {}),
  }
}

function toStorableResourceSide(side: ResourceSide) {
  return {
    ...side,
    byClass: Object.entries(side.byClass).map(([endpointClass, count]) => ({
      _key: endpointClass,
      endpointClass,
      count,
    })),
  }
}
