import {useEffect, useMemo, useRef, useState} from 'react'
import {combineLatest} from 'rxjs'
import {
  type DocumentActionComponent,
  type DocumentBadgeComponent,
  getPublishedId,
  type InitialValueTemplateItem,
  type InputProps,
  useClient,
  useConnectionState,
  useDocumentOperation,
  useDocumentPairPermissions,
  useDocumentPreviewStore,
  useDocumentStore,
  useDocumentValues,
  useEditState,
  useFormValue,
  useLoadable,
  useSyncState,
  useTemplatePermissions,
  useValidationStatus,
} from 'sanity'

import {PREVIEW_PATHS, PREVIEW_TARGET_IDS} from '../../scenarios/fixtures/customizationsFixture'
import {markRender} from './benchRenderMark'

/**
 * Components for the customization scenarios' workspaces. Every component uses
 * the PUBLIC `sanity` API in the call shapes customers naturally write —
 * inline literals included. Shapes marked "footgun" exercise a known,
 * unfixed render-loop hazard and belong to scenarios with
 * `expectedToSettle: false`; when the corresponding hardening lands, the
 * scenario flag flips and the shape becomes a permanent regression guard
 * (the way the inline `paths` array below guards #14241).
 */

/**
 * Holds ONE stable subscription over the same documents/paths the preview
 * rows observe, so the preview store replays synchronously on every
 * resubscribe. Without it a render loop ticks at refetch cadence instead of
 * render speed and looks deceptively harmless — in real studios the
 * document list plays this role. (Same trick as the RenderLoopRepro pane in
 * dev/test-studio.)
 */
function CacheWarmer(props: {ids: string[]}) {
  const {ids} = props
  const previewStore = useDocumentPreviewStore()
  const warm$ = useMemo(
    () =>
      combineLatest(
        ids.map((id) => previewStore.observePaths({_ref: id, _type: 'reference'}, PREVIEW_PATHS)),
      ),
    [previewStore, ids],
  )
  useLoadable(warm$)
  return null
}

function PreviewRow(props: {id: string; mark: string}) {
  const {id, mark} = props
  markRender(mark)
  // The exact #14241 customer shape: a fresh inline paths array every render.
  // Hardened via useShallowUnique — if that regresses, this loops again.
  const {value, isLoading} = useDocumentValues<{title?: string; subtitle?: string}>(id, [
    'title',
    'subtitle',
  ])
  return (
    <div data-testid="bench-preview-row">
      {isLoading ? 'Loading…' : (value?.title ?? '(untitled)')}
      <span> — {value?.subtitle ?? ''}</span>
    </div>
  )
}

/**
 * Custom input on previewHeavy's refs array: renders the default array input
 * plus a grid of preview rows, one per referenced document.
 */
export function ReferenceGridInput(props: InputProps) {
  markRender('previewHeavy.grid')
  // Inline path array — the natural call shape.
  const refs = useFormValue(['refs']) as {_ref: string; _key: string}[] | undefined
  const ids = useMemo(() => (refs ?? []).map((ref) => ref._ref), [refs])
  return (
    <>
      {props.renderDefault(props)}
      <div data-testid="bench-reference-grid">
        <CacheWarmer ids={ids} />
        {/* Keyed by array item, not target: the fixture references some
            targets twice, and duplicate keys would remount rows every render */}
        {(refs ?? []).map((ref) => (
          <PreviewRow key={ref._key} id={ref._ref} mark="previewHeavy.row" />
        ))}
      </div>
    </>
  )
}

/** Custom input echoing another field's value — useFormValue with an inline path. */
export function TitleEchoInput(props: InputProps) {
  markRender('customInputs.titleEcho')
  const title = useFormValue(['title']) as string | undefined
  return (
    <>
      {props.renderDefault(props)}
      <div data-testid="bench-title-echo">{title ?? ''}</div>
    </>
  )
}

/**
 * A status-bar input on the document-state hooks customers reach for first:
 * edit state, connection, sync, validation — plus useClient with an inline
 * options object (the natural shape).
 */
export function StatusBarInput(props: InputProps) {
  markRender('customInputs.statusBar')
  const documentId = getPublishedId(String(useFormValue(['_id']) ?? ''))
  const documentType = 'customInputs'
  const editState = useEditState(documentId, documentType)
  const connectionState = useConnectionState(documentId, documentType)
  const syncState = useSyncState(documentId, documentType)
  const validation = useValidationStatus(documentId, documentType, false)
  const client = useClient({apiVersion: '2024-01-01'})
  return (
    <>
      {props.renderDefault(props)}
      <div data-testid="bench-status-bar">
        {connectionState} · {editState.ready ? 'ready' : 'loading'} ·{' '}
        {syncState.isSyncing ? 'syncing' : 'idle'} · {validation.validation.length} validation
        marker(s) · {client.config().dataset}
      </div>
    </>
  )
}

/**
 * Custom document action: useDocumentOperation + useDocumentPairPermissions
 * in the natural inline-object shape (safe today — the wrapper memoizes on
 * scalars; this guards that property). Render-only: never actually
 * publishes — the mock only implements edit/create actions.
 */
export const BenchPublishAction: DocumentActionComponent = (props) => {
  markRender('documentActions.publishAction')
  useDocumentOperation(props.id, props.type)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: props.id,
    type: props.type,
    permission: 'publish',
  })
  return {
    label: isPermissionsLoading
      ? 'Bench publish (checking…)'
      : `Bench publish (${permissions?.granted ? 'granted' : 'denied'})`,
    disabled: true,
    onHandle: () => {},
  }
}

/**
 * Custom document badge — FOOTGUN, red today: useTemplatePermissions
 * memoizes its factory argument on the `templateItems` array REFERENCE, so
 * this inline array busts the memo every render and
 * createHookFromObservableFactory rebuilds its observable each time (the
 * same class as the useDocumentValues inline-paths bug). Flip the
 * documentActions scenario's expectedToSettle when that hook is hardened.
 */
export const BenchTemplateBadge: DocumentBadgeComponent = () => {
  markRender('documentActions.templateBadge')
  const [templatePermissions, isLoading] = useTemplatePermissions({
    templateItems: [
      {
        type: 'initialValueTemplateItem',
        id: 'documentActions',
        templateId: 'documentActions',
        schemaType: 'documentActions',
      } satisfies InitialValueTemplateItem,
    ],
  })
  return {
    label: isLoading ? 'checking' : templatePermissions?.length ? 'creatable' : 'not creatable',
  }
}

/** debugLoop burst shape — see LoopBurstInput. */
const BURST_START_MS = 2_000
const BURST_DURATION_MS = 6_000

/**
 * Debug fixture with a KNOWN activity shape: quiet for 2s after mount, then
 * timer-driven render churn (a setTimeout(0) chain forcing state updates —
 * ~150–250 commits/s under the nested-timeout clamp) for 6s, then quiet
 * again. Gives the settle charts a predictable plateau to display,
 * exercises the whole detection pipeline without depending on any real
 * studio-hook footgun, and doubles as the loop-detection self-test — no
 * historical build needed. Expected result: settles with settleTimeMs ≈ 8s
 * and a commit-rate plateau in the timeline.
 */
export function LoopBurstInput(props: InputProps) {
  markRender('debugLoop.burst')
  const [phase, setPhase] = useState<'idle' | 'burst' | 'done'>('idle')
  const [, force] = useState(0)
  // The schedule is anchored to the input becoming editable, not to mount:
  // the form first renders read-only while the document connects, and settle
  // discards everything before readiness (the same read-only flip). Anchoring
  // to mount would let part of the burst drain as boot noise. Started once —
  // a later read-only interruption must not restart or cancel it.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => {
    if (props.readOnly || timers.current.length > 0) return
    timers.current.push(
      setTimeout(() => setPhase('burst'), BURST_START_MS),
      setTimeout(() => setPhase('done'), BURST_START_MS + BURST_DURATION_MS),
    )
  }, [props.readOnly])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if (phase !== 'burst') return undefined
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      force((count) => count + 1)
      timer = setTimeout(tick, 0)
    }
    timer = setTimeout(tick, 0)
    return () => clearTimeout(timer)
  }, [phase])
  return (
    <>
      {props.renderDefault(props)}
      <div data-testid="bench-debug-loop">{phase}</div>
    </>
  )
}

/**
 * Custom structure pane rendering preview rows in the SAFE shape
 * (module-constant paths) — the component-pane counterpart of previewHeavy,
 * and the first consumer of the scenario `path`/`readySelector` fields.
 */
export function BenchStructurePane() {
  markRender('structurePane.pane')
  return (
    <div data-testid="bench-custom-pane">
      <CacheWarmer ids={PREVIEW_TARGET_IDS} />
      {PREVIEW_TARGET_IDS.map((id) => (
        <StablePreviewRow key={id} id={id} />
      ))}
    </div>
  )
}

function StablePreviewRow(props: {id: string}) {
  const {id} = props
  markRender('structurePane.row')
  const {value, isLoading} = useDocumentValues<{title?: string}>(id, PREVIEW_PATHS)
  return (
    <div data-testid="bench-stable-preview-row">
      {isLoading ? 'Loading…' : (value?.title ?? '(untitled)')}
    </div>
  )
}

/**
 * Custom structure pane driving documentStore.listenQuery — FOOTGUN, red
 * today: the observable is built inline during render (the natural shape),
 * so useLoadable — which keys on the observable REFERENCE — resubscribes a
 * brand-new pipeline every render. Flip the listenQueryPane scenario's
 * expectedToSettle when this class is hardened.
 */
export function ListenQueryPane() {
  markRender('listenQueryPane.pane')
  const documentStore = useDocumentStore()
  const results = useLoadable(
    documentStore.listenQuery(
      '*[_type == "previewTarget"]{_id, title}',
      {},
      {tag: 'bench.listen-query'},
    ),
  )
  const documents = (results.value ?? []) as {_id: string; title?: string}[]
  return (
    <div data-testid="bench-listen-query-pane">
      {results.isLoading
        ? 'Loading…'
        : documents.map((doc) => <div key={doc._id}>{doc.title ?? doc._id}</div>)}
    </div>
  )
}
