import {Badge, Box, Card, Stack, Text} from '@sanity/ui'
import {startTransition, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest} from 'rxjs'
import {useDocumentPreviewStore, useDocumentValues} from 'sanity'
import {Flex} from 'ui5'

/**
 * Reproduces a customer-reported stall: document panes that never finish
 * opening while list previews are on screen.
 *
 * The preview rows below call `useDocumentValues(id, ['title'])` with an
 * inline paths array — the natural call shape. The hook memoizes its
 * observable on the array REFERENCE, so every render builds a new observable;
 * react-rx v5 treats each one as a brand-new store whose warm-up replays the
 * cached value synchronously, and the fresh snapshot forces another render —
 * a self-sustaining loop.
 *
 * The pane simulates opening a document at the same time: a heavy subtree
 * mounts in a transition the moment the pane opens. Every loop iteration is
 * an urgent update that restarts the in-flight mount, so the status line
 * stays stuck at "mounting…" for as long as the loop runs. After 15 seconds
 * the loop rows remove themselves — and the mount lands immediately. That is
 * the customer's timeline: the stall lasts exactly as long as the pressure.
 *
 * Once useDocumentValues keys its memo on path CONTENTS instead of the array
 * reference, the rows settle after a couple of renders and the mount
 * completes right away.
 *
 * The cache warmer keeps a stable subscription to the same documents so the
 * preview store replays synchronously on every resubscribe — without it the
 * loop ticks at refetch cadence instead of render speed and looks harmless
 * (in real studios the actual document list plays this role).
 *
 * Unit-level twin:
 * packages/sanity/src/core/store/document/hooks/__tests__/useDocumentValuesRenderLoop.repro.test.tsx
 */

const DOC_IDS = ['render-loop-1', 'render-loop-2', 'render-loop-3', 'render-loop-4']
const PREVIEW_PATHS = ['title']
const LOOP_DURATION_MS = 15_000

const renderCounts = {rows: 0}

function CacheWarmer() {
  const previewStore = useDocumentPreviewStore()
  const warm$ = useMemo(
    () =>
      combineLatest(
        DOC_IDS.map((id) =>
          previewStore.observePaths({_ref: id, _type: 'reference'}, PREVIEW_PATHS),
        ),
      ),
    [previewStore],
  )
  useObservable(warm$)
  return null
}

function PreviewRow({id}: {id: string}) {
  // oxlint-disable-next-line react/immutability -- deliberate render counter: this repro exists to make the loop measurable
  renderCounts.rows++
  // The footgun: a fresh array literal on every render
  const {value, isLoading} = useDocumentValues<{title?: string}>(id, ['title'])
  return (
    <Card border padding={3} radius={2}>
      <Stack gap={2}>
        <Text size={1} weight="medium">
          {isLoading ? 'Loading…' : value?.title || '(untitled)'}
        </Text>
        <Text size={0} muted>
          {id}
        </Text>
      </Stack>
    </Card>
  )
}

/**
 * Renders/second meter. Stops updating when `running` flips false so its own
 * interval doesn't keep interrupting the transition mount after the loop ends.
 */
function RateBadge({running}: {running: boolean}) {
  const [rate, setRate] = useState(0)
  const [total, setTotal] = useState(0)
  useEffect(() => {
    if (!running) return undefined
    let last = renderCounts.rows
    const interval = setInterval(() => {
      const now = renderCounts.rows
      setRate((now - last) * 2)
      setTotal(now)
      last = now
    }, 500)
    return () => clearInterval(interval)
  }, [running])
  return (
    <Flex gap={2} alignItems="center">
      <Badge tone={rate > 50 ? 'critical' : 'positive'}>{rate} renders/s</Badge>
      <Text size={0} muted>
        {total} total
      </Text>
    </Flex>
  )
}

/* oxlint-disable react/purity -- deliberately impure render: simulates one expensive component of a mounting document pane */
function BusySlice() {
  const end = performance.now() + 1
  while (performance.now() < end) {
    // burn main-thread time
  }
  return <span hidden />
}
/* oxlint-enable react/purity */

const SLICES = Array.from({length: 100}, (_, index) => index)

function HeavySubtree({onMounted}: {onMounted: () => void}) {
  useEffect(() => onMounted(), [onMounted])
  return (
    <>
      {SLICES.map((slice) => (
        <BusySlice key={slice} />
      ))}
    </>
  )
}

/**
 * Simulates opening a document: transition-mounts a ~100ms subtree as soon as
 * the pane opens and reports how long the mount took. While the loop runs,
 * every iteration restarts this mount — the status stays at "mounting…".
 */
function DocumentOpenSimulation() {
  const [show, setShow] = useState(false)
  const [mountedAfterMs, setMountedAfterMs] = useState<number | null>(null)
  const startedAtRef = useRef(0)
  useEffect(() => {
    startedAtRef.current = performance.now()
    startTransition(() => setShow(true))
  }, [])
  const handleMounted = useCallback(() => {
    setMountedAfterMs(performance.now() - startedAtRef.current)
  }, [])
  return (
    <Card border padding={3} radius={2} tone={mountedAfterMs === null ? 'critical' : 'positive'}>
      <Text size={1} weight="medium">
        {mountedAfterMs === null
          ? 'Document open simulation: mounting… (stalled by the loop)'
          : `Document open simulation: mounted after ${(mountedAfterMs / 1000).toFixed(1)}s`}
      </Text>
      {show && <HeavySubtree onMounted={handleMounted} />}
    </Card>
  )
}

export function RenderLoopRepro() {
  const [loopRunning, setLoopRunning] = useState(true)
  useEffect(() => {
    const timeout = setTimeout(() => setLoopRunning(false), LOOP_DURATION_MS)
    return () => clearTimeout(timeout)
  }, [])
  return (
    <Box padding={4}>
      <CacheWarmer />
      <Stack gap={4}>
        <Card padding={3} radius={2} tone="caution">
          <Stack gap={3}>
            <Text size={1} weight="medium">
              useDocumentValues render loop → stalled document open
            </Text>
            <Text size={1} muted>
              The preview rows pass an inline paths array to useDocumentValues. On studio versions
              where the hook memoizes on the array reference, the rows re-render in a tight loop and
              the simulated document open below stays stuck at "mounting…" until the rows remove
              themselves after {LOOP_DURATION_MS / 1000} seconds — the stall lasts exactly as long
              as the loop. With the hardened hook (memo keyed on path contents) the rows settle
              immediately and the mount lands right away.
            </Text>
          </Stack>
        </Card>
        <DocumentOpenSimulation />
        <Flex alignItems="center" justifyContent="space-between">
          <Text size={1} weight="medium">
            {loopRunning ? 'Preview rows (looping)' : 'Preview rows removed — loop over'}
          </Text>
          <RateBadge running={loopRunning} />
        </Flex>
        {loopRunning && DOC_IDS.map((id) => <PreviewRow key={id} id={id} />)}
      </Stack>
    </Box>
  )
}
