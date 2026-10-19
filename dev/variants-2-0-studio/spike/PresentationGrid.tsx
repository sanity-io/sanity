import {createConnectionMachine, createController} from '../../../packages/sanity/node_modules/@sanity/comlink'
import {createCompatibilityActors} from '../../../packages/sanity/node_modules/@sanity/presentation-comlink'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {Box, Button, Card, Flex, Heading, Select, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo, useRef, useState} from 'react'
import {type Tool, useClient} from 'sanity'

import {type Chosen} from '../c1/model'
import {Picker} from '../c1/Picker'
import {DimensionButton} from '../c1/StateMenu'
import {useDimensions, useVariantDefinitions} from '../c1/world'
import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {useCorpus} from '../c5/useCorpus'
import {useVersionList} from '../data/useVersionList'
import {PageVersionLabel, pageVersion} from '../presentation/pageVersion'

// SPIKE (not in the main workspace config; enabled with SANITY_STUDIO_GRID=1): the "Presentation grid" tool mounts N
// preview iframes. Every frame has its OWN state (route, audience/variant, perspective, viewport, connected on/off), its
// OWN comlink controller and `presentation` channel, and nothing is a singleton. State is serialised to the tool URL
// (`?g=`), so a grid can be shared. The real Presentation tool is untouched.
//
// Differences from real Presentation, on purpose for the spike:
//  - no loader channel (the loaders are a singleton in PresentationTool): the grid fetches each frame's data itself
//    (the editor's session, apiVersion X, `variant` + `perspective` query options) and posts it to the frame;
//  - the channel handles the perspective handshake (`visual-editing/fetch-perspective`), `visual-editing/focus`
//    (click-to-edit) and `visual-editing/documents` (documents on the page). It does not handle snapshots/mutations,
//    so edits show up on the next poll (4 s), not live.

const ORIGIN = 'http://localhost:3334'
const PREVIEW = `${ORIGIN}/variants-preview.html`

type Viewport = 'desktop' | 'tablet' | 'phone'
type Perspective = 'drafts' | 'published'

interface FrameSpec {
  id: string
  route: string
  /** Bare variant id, or undefined for the base document. */
  variant?: string
  perspective: Perspective
  viewport: Viewport
  connected: boolean
}

const SIZE: Record<Viewport, {w: number; h: number; scale: number}> = {
  desktop: {w: 1280, h: 800, scale: 0.34},
  tablet: {w: 768, h: 1000, scale: 0.56},
  phone: {w: 390, h: 760, scale: 0.9},
}

let nextId = 1
const frame = (route: string, variant: string | undefined, viewport: Viewport, extra: Partial<FrameSpec> = {}): FrameSpec => ({
  id: `f${nextId++}`,
  route,
  variant,
  perspective: 'drafts',
  viewport,
  connected: true,
  ...extra,
})

const LIGHTHOUSE = 'book:book-lighthouse'
const PRESETS: Record<string, () => FrameSpec[]> = {
  // One route, three audiences.
  Compare: () => [undefined, 'aud-members', 'aud-students'].map((v) => frame(LIGHTHOUSE, v, 'phone')),
  // Five routes at phone width.
  'Device wall': () => ['list', LIGHTHOUSE, 'book:book-glass', 'book:book-harvest', 'book:book-rail'].map((r) => frame(r, undefined, 'phone')),
  // Three routes, one audience.
  Sitemap: () => ['list', LIGHTHOUSE, 'book:book-glass'].map((r) => frame(r, 'aud-members', 'tablet')),
  // Two routes by three audiences.
  Matrix: () => ['list', LIGHTHOUSE].flatMap((r) => [undefined, 'aud-members', 'aud-students'].map((v) => frame(r, v, 'phone'))),
}

const QUERY_LIST = `*[_type == "book"] | order(title asc) {_id, _type, title, subtitle}`
const QUERY_ONE = `*[_type == "book" && _id == $id][0] {_id, _type, title, subtitle, blurb}`

interface PageDoc {
  _id: string
  _type: string
}
interface Report {
  status: string
  fetchPerspective: number
  docs: PageDoc[]
}
interface EditTarget {
  frameId: string
  id: string
  type: string
}

const encode = (frames: FrameSpec[]) => btoa(unescape(encodeURIComponent(JSON.stringify(frames))))
const decode = (text: string): FrameSpec[] | null => {
  try {
    const frames = JSON.parse(decodeURIComponent(escape(atob(text)))) as FrameSpec[]
    return Array.isArray(frames) ? frames : null
  } catch {
    return null
  }
}

function previewSrc(spec: FrameSpec) {
  return `${PREVIEW}?mode=grid&frame=${spec.id}&route=${encodeURIComponent(spec.route)}`
}

/**
 * The C1 audience control inside a frame header: the same picker as the navbar's Variants control, but it sets THIS
 * frame's audience (variant), not the studio's.
 */
function FrameAudience({spec, onChange}: {spec: FrameSpec; onChange: (next: FrameSpec) => void}) {
  const definitions = useVariantDefinitions()
  const dimensions = useDimensions()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const def = definitions.find((d) => d._id.replace(/^_\.variants\./, '') === spec.variant)
  const chosen: Chosen = def?.conditions ?? {}
  const apply = (next: Chosen) => {
    const entries = Object.entries(next)
    const exact = entries.length
      ? definitions.find((v) => {
          const own = Object.entries(v.conditions)
          return own.length === entries.length && own.every(([name, key]) => next[name] === key)
        })
      : undefined
    onChange({...spec, variant: exact ? exact._id.replace(/^_\.variants\./, '') : undefined})
  }
  return (
    <div ref={setAnchor}>
      <DimensionButton icon={<RhombusIcon />} onClick={() => setOpen(!open)} open={open} shape="box" testId={`frame-audience-${spec.id}`} text={def?.metadata?.title ?? 'Base'} />
      <Picker
        anchor={anchor}
        chosen={chosen}
        dimensions={dimensions}
        onClear={() => apply({})}
        onClose={() => setOpen(false)}
        onPick={(dimension, key) => {
          const next = {...chosen}
          if (key === null) delete next[dimension]
          else next[dimension] = key
          apply(next)
          setOpen(false)
        }}
        open={open}
        placement="bottom-start"
      />
    </div>
  )
}

/** One iframe with its own controller and channel. */
function GridFrame(props: {
  spec: FrameSpec
  onChange: (next: FrameSpec | null) => void
  onDuplicate: () => void
  onReport: (id: string, patch: Partial<Report>) => void
  onFocus: (target: EditTarget) => void
  routes: string[]
  audiences: {id: string; title: string}[]
  report?: Report
}) {
  const {spec, onChange, onDuplicate, onReport, onFocus, routes, audiences, report} = props
  const studioClient = useClient({apiVersion: 'X'})
  const iframe = useRef<HTMLIFrameElement | null>(null)
  const channel = useRef<{post: (type: string, data: unknown) => void} | null>(null)
  const [loaded, setLoaded] = useState(false)
  const src = useMemo(() => previewSrc(spec), [spec.id, spec.route])
  const live = useRef({perspective: spec.perspective, variant: spec.variant})
  live.current = {perspective: spec.perspective, variant: spec.variant}

  // The channel: one controller, one `presentation` channel per connected iframe.
  useEffect(() => {
    const target = iframe.current?.contentWindow
    if (!loaded || !target || !spec.connected) {
      onReport(spec.id, {status: spec.connected ? 'loading' : 'off'})
      return undefined
    }
    const controller = createController({targetOrigin: ORIGIN})
    controller.addTarget(target)
    const comlink: any = controller.createChannel(
      {name: 'presentation', heartbeat: true, connectTo: 'visual-editing'},
      createConnectionMachine().provide({actors: createCompatibilityActors()}),
    )
    channel.current = comlink
    let requests = 0
    const offFetch = comlink.on('visual-editing/fetch-perspective', () => {
      requests += 1
      onReport(spec.id, {fetchPerspective: requests})
      return {perspective: live.current.perspective, variant: live.current.variant}
    })
    const offFocus = comlink.on('visual-editing/focus', (data: {id?: string; type?: string}) => {
      if (data?.id && data?.type) onFocus({frameId: spec.id, id: data.id, type: data.type})
    })
    const offDocs = comlink.on('visual-editing/documents', (data: {documents: PageDoc[]}) => {
      onReport(spec.id, {docs: data.documents})
    })
    const offStatus = comlink.onStatus?.((event: {status?: string} | string) => onReport(spec.id, {status: typeof event === 'string' ? event : (event.status ?? 'connecting')}))
    const stop = comlink.start()
    return () => {
      offFetch?.()
      offFocus?.()
      offDocs?.()
      offStatus?.()
      stop()
      controller.destroy()
      channel.current = null
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- spike: one channel per loaded, connected iframe
  }, [loaded, spec.connected, spec.id])

  // Perspective and variant changes go out over THIS frame's channel.
  useEffect(() => {
    channel.current?.post('presentation/perspective', {perspective: spec.perspective, variant: spec.variant})
  }, [spec.perspective, spec.variant, loaded])

  // The data: fetched with the editor's session (variant + perspective) and posted to the frame.
  useEffect(() => {
    if (!loaded) return undefined
    let cancelled = false
    const client = studioClient.withConfig({apiVersion: 'X', perspective: spec.perspective, useCdn: false})
    const run = async () => {
      const isBook = spec.route.startsWith('book:')
      const data = await client
        .fetch(isBook ? QUERY_ONE : QUERY_LIST, isBook ? {id: spec.route.slice(5)} : {}, {perspective: spec.perspective, variant: spec.variant} as never)
        .catch(() => null)
      if (cancelled) return
      iframe.current?.contentWindow?.postMessage({type: 'grid-data', frame: spec.id, data}, ORIGIN)
      if (!spec.connected) {
        const docs = (Array.isArray(data) ? data : data ? [data] : []) as PageDoc[]
        onReport(spec.id, {docs})
      }
    }
    void run()
    const timer = window.setInterval(run, 4000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- spike
  }, [loaded, spec.perspective, spec.route, spec.variant, spec.connected, studioClient, spec.id])

  const size = SIZE[spec.viewport]
  const openInPresentation = `/presentation?preview=${encodeURIComponent(`/variants-preview.html?route=${encodeURIComponent(spec.route)}`)}&perspective=${spec.perspective === 'published' ? 'published' : 'drafts'}${spec.variant ? `&variant=${spec.variant}` : ''}${spec.viewport === 'phone' ? '&viewport=mobile' : ''}`
  return (
    <Card border data-testid={`grid-frame-${spec.id}`} padding={2} radius={2} style={{flex: 'none', width: size.w * size.scale + 16}}>
      <Stack gap={2}>
        <Flex align="center" gap={1} wrap="wrap">
          <Select fontSize={0} onChange={(e) => onChange({...spec, route: e.currentTarget.value})} value={spec.route}>
            {routes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <FrameAudience onChange={(next) => onChange(next)} spec={spec} />
        </Flex>
        <Flex align="center" gap={1} wrap="wrap">
          <Button fontSize={0} mode={spec.perspective === 'drafts' ? 'default' : 'ghost'} onClick={() => onChange({...spec, perspective: spec.perspective === 'drafts' ? 'published' : 'drafts'})} padding={1} text={spec.perspective === 'drafts' ? 'Drafts' : 'Published'} />
          {(['desktop', 'tablet', 'phone'] as Viewport[]).map((v) => (
            <Button fontSize={0} key={v} mode={spec.viewport === v ? 'default' : 'ghost'} onClick={() => onChange({...spec, viewport: v})} padding={1} text={v === 'desktop' ? '1280' : v === 'tablet' ? '768' : '390'} />
          ))}
          <Button fontSize={0} mode="ghost" onClick={() => onChange({...spec, connected: !spec.connected})} padding={1} text={spec.connected ? 'Connected' : 'Static'} tone={spec.connected ? 'positive' : 'default'} />
          <Button fontSize={0} mode="bleed" onClick={onDuplicate} padding={1} text="Duplicate" />
          <Button fontSize={0} mode="bleed" onClick={() => onChange(null)} padding={1} text="Remove" tone="critical" />
          <a href={openInPresentation} style={{fontSize: 11}}>Open in Presentation</a>
        </Flex>
        <Text data-testid={`grid-status-${spec.id}`} muted size={0}>
          {report?.status ?? '…'} · perspective requests {report?.fetchPerspective ?? 0} · {report?.docs.length ?? 0} documents
        </Text>
        <div style={{height: size.h * size.scale, overflow: 'hidden', width: size.w * size.scale}}>
          <iframe
            onLoad={() => setLoaded(true)}
            ref={iframe}
            src={src}
            style={{background: 'white', border: 0, height: size.h, transform: `scale(${size.scale})`, transformOrigin: 'top left', width: size.w}}
            title={spec.id}
          />
        </div>
      </Stack>
    </Card>
  )
}

/** One document of a frame's page, with the version that frame's audience gets. */
function PageDocRow({doc, spec}: {doc: PageDoc; spec: FrameSpec}) {
  const versions = useVersionList(doc._id.replace(/^(drafts\.|versions\.[^.]+\.)/, ''))
  const definitions = useVariantDefinitions()
  const title = spec.variant ? (definitions.find((d) => d._id.replace(/^_\.variants\./, '') === spec.variant)?.metadata?.title ?? spec.variant) : null
  if (!versions) return null
  if (!spec.variant || !title) return <Text muted size={0}>{doc._id} · base</Text>
  return (
    <Flex align="center" gap={2}>
      <Text size={0}>{doc._id}</Text>
      <PageVersionLabel version={pageVersion(versions, spec.variant, title, spec.perspective)} />
    </Flex>
  )
}

function Grid() {
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  const [frames, setFrames] = useState<FrameSpec[]>(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('g')
    return (fromUrl && decode(fromUrl)) || PRESETS.Compare()
  })
  const [reports, setReports] = useState<Record<string, Report>>({})
  const [edit, setEdit] = useState<EditTarget | null>(null)

  // The whole grid in the tool URL: a link shares it.
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('g', encode(frames))
    window.history.replaceState(window.history.state, '', url)
  }, [frames])

  const onReport = (id: string, patch: Partial<Report>) =>
    setReports((prev) => ({...prev, [id]: Object.assign({status: 'loading', fetchPerspective: 0, docs: []} as Report, prev[id], patch)}))
  ;(window as unknown as {__grid?: unknown}).__grid = reports

  const routes = useMemo(() => ['list', ...(corpus?.docs ?? []).map((d) => `book:${d.id}`)], [corpus])
  const audiences = useMemo(() => definitions.map((d) => ({id: d._id.replace(/^_\.variants\./, ''), title: d.metadata?.title ?? d._id})), [definitions])
  const editSpec = edit ? frames.find((f) => f.id === edit.frameId) : undefined
  const editVariantTitle = editSpec?.variant ? (audiences.find((a) => a.id === editSpec.variant)?.title ?? editSpec.variant) : 'Base'

  return (
    <Flex height="fill" style={{height: '100%'}}>
      <Box flex={1} padding={4} style={{minWidth: 0, overflow: 'auto'}}>
        <Stack gap={4}>
          <Heading size={2}>Presentation grid (spike)</Heading>
          <Flex gap={2} wrap="wrap">
            {Object.keys(PRESETS).map((name) => (
              <Button fontSize={1} key={name} mode="ghost" onClick={() => { setReports({}); setFrames(PRESETS[name]()) }} padding={2} text={name} />
            ))}
            <Button fontSize={1} mode="default" onClick={() => setFrames((f) => [...f, frame(LIGHTHOUSE, undefined, 'phone')])} padding={2} text="Add frame" tone="primary" />
          </Flex>
          <Flex data-testid="grid-frames" gap={3} wrap="wrap">
            {frames.map((spec) => (
              <GridFrame
                audiences={audiences}
                key={spec.id}
                onChange={(next) => setFrames((all) => (next ? all.map((f) => (f.id === spec.id ? next : f)) : all.filter((f) => f.id !== spec.id)))}
                onDuplicate={() => setFrames((all) => { const at = all.findIndex((f) => f.id === spec.id); const copy = {...spec, id: `f${nextId++}`}; return [...all.slice(0, at + 1), copy, ...all.slice(at + 1)] })}
                onFocus={setEdit}
                onReport={onReport}
                report={reports[spec.id]}
                routes={routes}
                spec={spec}
              />
            ))}
          </Flex>
        </Stack>
      </Box>
      <Box padding={3} style={{borderLeft: '1px solid var(--card-border-color)', flex: 'none', overflow: 'auto', width: 340}}>
        <Stack gap={4}>
          <Stack gap={2} data-testid="grid-edit">
            <Text size={1} weight="medium">Click to edit</Text>
            {edit && editSpec ? (
              <Card border padding={3} radius={2} tone="primary">
                <Stack gap={2}>
                  <Text size={1}>{edit.id}</Text>
                  <Text muted size={0}>From frame {edit.frameId} · {editVariantTitle} · {editSpec.perspective} · {editSpec.route}</Text>
                  <a href={`/structure/${edit.type};${edit.id}?perspective=${editSpec.perspective}${editSpec.variant ? `&variant=${editSpec.variant}` : ''}`} style={{fontSize: 13}}>Open the form in the Structure tool</a>
                  {/* The real form at this version: the Structure tool in an iframe (same session). */}
                  <iframe
                    data-testid="grid-edit-form"
                    src={`/structure/${edit.type};${edit.id}?perspective=${editSpec.perspective}${editSpec.variant ? `&variant=${editSpec.variant}` : ''}&preset=open-beta-a`}
                    style={{border: '1px solid var(--card-border-color)', borderRadius: 4, height: 620, width: '100%'}}
                    title="Document form"
                  />
                </Stack>
              </Card>
            ) : (
              <Text muted size={0}>Click text in a connected frame.</Text>
            )}
          </Stack>
          <Stack gap={2} data-testid="grid-docs">
            <Text size={1} weight="medium">Documents on these pages</Text>
            {frames.map((spec) => (
              <Stack gap={1} key={spec.id}>
                <Text muted size={0}>{spec.id} · {spec.route} · {audiences.find((a) => a.id === spec.variant)?.title ?? 'Base'}</Text>
                {(reports[spec.id]?.docs ?? []).slice(0, 6).map((doc) => (
                  <PageDocRow doc={doc} key={doc._id} spec={spec} />
                ))}
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Flex>
  )
}

export const presentationGridTool: Tool = {
  name: 'presentation-grid',
  title: 'Presentation grid',
  icon: ThLargeIcon,
  component: Grid,
}
