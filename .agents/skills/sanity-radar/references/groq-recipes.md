# GROQ recipes for the Radar dataset

Project `mhfozd0z`, dataset `bench`. The dataset is private: every query needs a token with read
access to the project (`SANITY_AUTH_TOKEN` below — your CLI token from `sanity debug --secrets`
works). Run any query with:

```bash
q='<groq>'
curl -sG "https://mhfozd0z.api.sanity.io/v2025-02-19/data/query/bench" \
  -H "Authorization: Bearer $SANITY_AUTH_TOKEN" --data-urlencode "query=$q" | jq .result
```

Every recipe projects; none fetches `sessions`. Ranges are `start`/`end` ISO dates or shas —
substitute or pass them as `$params` (`--data-urlencode '$sha="…"'`).

## Health of the main-branch series

```groq
// Latest 10 daily points with host context — read calibration before believing any ms value
*[_type == "benchRun" && mode == "absolute" && git.branch == "main"]
  | order(coalesce(git.committedAt, startedAt) desc)[0...10]{
  _id, startedAt, trigger, releaseTag,
  "sha": git.sha, "committedAt": git.committedAt,
  "calibrationMs": runner.calibrationMs, "cpuModel": runner.cpuModel, "runId": runner.runId
}
```

```groq
// Days with a stored main run since $start — diff against a calendar outside GROQ to find gaps
array::unique(*[_type == "benchRun" && mode == "absolute" && git.branch == "main"
  && startedAt > $start]{"day": string::split(startedAt, "T")[0]}.day)
```

## One metric over time

```groq
// p50/p75/p90 of a metric per run, with the shard's own host calibration
*[_type == "benchRun" && mode == "absolute" && git.branch == "main"]
  | order(coalesce(git.committedAt, startedAt) asc){
  "date": coalesce(git.committedAt, startedAt), "sha": git.sha,
  "runCalibrationMs": runner.calibrationMs,
  "shard": scenarios[scenario == $scenario][0]{
    "calibrationMs": runner.calibrationMs, "cpuModel": runner.cpuModel,
    "metric": metrics[label == $label][0].experiment.summary{median, p75, p90, n}
  }
}
```

Per-scenario `kind` is `interaction` or `pageload`; `mode` is set only for the extra daily modes
(`inp`, `soak`). Interaction metric labels are the **field names typed into** (`stringField`,
`title`, `body`, `simple-en`…), each carrying keystroke latency; pageload labels are
`<condition> · <metric>` (`boot-cold · time to editable`, `open-doc-warm · LCP`, `boot-cold · auth
round trips`…); INP scenarios carry `INP` and `INP interactions`. Scenario ids come from
`pnpm bench scenarios`. Bundle size is top-level per side: `bundle.experiment{initialJsBytes,
totalJsBytes, chunkCount}`. Soak lives on the soak scenario: `scenarios[mode == "soak"][0].soak`.
Resources (request counts, DOM nodes, listeners, heap) sit on interaction scenarios:
`scenarios[kind == "interaction"]{scenario, "r": resources.experiment{requestCount, domNodes, listeners, heapMb}}`.

## Runs for a specific commit

```groq
// Every run that measured this sha (re-runs land on different hosts — compare calibration)
*[_type == "benchRun" && git.sha == $sha]{
  _id, mode, trigger, startedAt, "branch": git.branch,
  "calibrationMs": runner.calibrationMs, "cpuModel": runner.cpuModel, "runId": runner.runId
}
```

## A/B comparisons (investigation records)

```groq
// Newest first; verdict counts per run
*[_type == "benchRun" && mode == "ab"] | order(startedAt desc){
  _id, startedAt,
  "from": git.mergeBaseSha, "to": git.sha, "runId": runner.runId,
  "regressions": count(scenarios[].metrics[comparison.verdict == "regression"]),
  "improvements": count(scenarios[].metrics[comparison.verdict == "improvement"]),
  "inconclusive": count(scenarios[].metrics[comparison.verdict == "inconclusive"])
}
```

```groq
// The judged metrics of one comparison
*[_type == "benchRun" && mode == "ab" && _id == $id][0].scenarios[]{
  scenario, mode,
  "metrics": metrics[defined(comparison)]{
    label, unit,
    "reference": reference.summary.median, "experiment": experiment.summary.median,
    comparison{diff, lo, hi, verdict}
  }
}
```

## Git history

```groq
// Commits between two runs' shas, newest first (committedAt window; for the exact first-parent
// chain walk parentSha from $to until $from)
*[_type == "gitCommit" && committedAt > *[_type == "gitCommit" && sha == $from][0].committedAt
  && committedAt <= *[_type == "gitCommit" && sha == $to][0].committedAt]
  | order(committedAt desc){sha, subject, prNumber, authorLogin, committedAt, testStudioUrl}
```

```groq
// Stable releases on main, with what npm currently says about them
*[_type == "gitTag" && !defined(prerelease) && defined(*[_type == "gitCommit" && sha == ^.sha][0])]
  | order(taggedAt desc)[0...20]{tag, sha, taggedAt, "distTags": npm.distTags, "downloads": npm.weeklyDownloads}
```

```groq
// Which release first shipped a commit: the earliest tag whose commit is at or after it
*[_type == "gitTag" && !defined(prerelease) && taggedAt >= *[_type == "gitCommit" && sha == $sha][0].committedAt]
  | order(taggedAt asc)[0]{tag, taggedAt}
```

(By-date, like the dashboard's release bracket: it says "shipped after", not "contained in".
Containment needs the first-parent walk.)

## Bisect sessions and acks

```groq
*[_type == "bisectSession" && defined(result.firstBadSha)] | order(createdAt desc){
  title, "firstBad": result.firstBadSha, "regression": result.regression, "suspects": result.suspectShas, createdBy
}
```

```groq
*[_type == "driftAck"]{metricKey, branch, state, until, note, ackedBy, ackedAt}
```
