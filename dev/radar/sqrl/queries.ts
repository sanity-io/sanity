import {SQRL_METRIC_LABELS} from './inputs'

/** Everything the SQRL inputs read from main's absolute runs, and nothing else — never `sessions`. */
export const SQRL_RUNS_QUERY = `*[_type == "benchRun" && mode == "absolute" && git.branch == "main"] | order(coalesce(git.committedAt, startedAt) asc) {
  _id,
  startedAt,
  git{sha, committedAt},
  runner{calibrationMs, cpuModel},
  "totalJsBytes": bundle.experiment.totalJsBytes,
  "scenarios": scenarios[]{
    scenario,
    kind,
    mode,
    "calibrationMs": runner.calibrationMs,
    "metrics": metrics[label in $labels]{label, "median": experiment.summary.median, "p75": experiment.summary.p75},
    "resources": resources.experiment{cpuTaskMs, cpuScriptMs, heapMb, domNodes, listeners, requestCount},
    "soak": soak.samples[]{minute, heapMb}
  }
}`

export const SQRL_RUNS_PARAMS = {labels: SQRL_METRIC_LABELS}

export const SQRL_TAGS_QUERY = `*[_type == "gitTag"] | order(taggedAt asc) {
  tag,
  major,
  minor,
  patch,
  prerelease,
  taggedAt,
  "publishedAt": npm.publishedAt,
  "deprecated": npm.deprecated
}`
