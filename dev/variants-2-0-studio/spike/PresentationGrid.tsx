import {createConnectionMachine, createController} from '../../../packages/sanity/node_modules/@sanity/comlink'
import {createCompatibilityActors} from '../../../packages/sanity/node_modules/@sanity/presentation-comlink'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {Box, Button, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo, useRef, useState} from 'react'
import {type Tool, useClient} from 'sanity'

// SPIKE (not in the main workspace config; enabled with SANITY_STUDIO_GRID=1): a "Presentation grid" tool that mounts N
// preview iframes, each with its OWN comlink controller and `presentation` channel, its own route and viewport, and
// its own audience (variant). It answers one question: do several channels to several iframes work at once, and what
// breaks. The real Presentation tool is not touched (its machine, documents-on-page and loaders are singletons).
//
// Differences from the real Presentation, on purpose for the spike:
//  - no loader channel (the loaders are a singleton in PresentationTool): the grid fetches each frame's data itself,
//    with the editor's session, and posts it to the frame (`grid-data`);
//  - the channel answers only the perspective handshake (`visual-editing/fetch-perspective`) and posts
//    `presentation/perspective` {perspective, variant} per frame.

const ORIGIN = 'http://localhost:3334'
const PREVIEW = `${ORIGIN}/variants-preview.html`

interface FrameSpec {
  id: string
  route: string
  /** Variant id (bare), or undefined for the base document. */
  variant?: string
  viewport: 'phone' | 'desktop'
}

interface FrameStatus {
  channel: 'connecting' | 'connected' | 'error'
  perspectivePosted: number
  fetchPerspectiveRequests: number
}

const LAYOUTS: Record<string, FrameSpec[]> = {
  // One route, several audiences side by side.
  Compare: [
    {id: 'c1', route: 'book:book-lighthouse', viewport: 'phone'},
    {id: 'c2', route: 'book:book-lighthouse', variant: 'aud-members', viewport: 'phone'},
    {id: 'c3', route: 'book:book-lighthouse', variant: 'aud-students', viewport: 'phone'},
    {id: 'c4', route: 'book:book-lighthouse', variant: 'aud-nordic-region', viewport: 'phone'},
  ],
  // Several routes at phone width.
  Wall: ['list', 'book:book-lighthouse', 'book:book-glass', 'book:book-harvest', 'book:book-rail'].map((route, i) => ({
    id: `w${i + 1}`,
    route,
    viewport: 'phone' as const,
  })),
  Two: [
    {id: 't1', route: 'book:book-lighthouse', viewport: 'desktop'},
    {id: 't2', route: 'book:book-lighthouse', variant: 'aud-members', viewport: 'desktop'},
  ],
}

const QUERY_LIST = `*[_type == "book"] | order(title asc) {_id, _type, title, subtitle}`
const QUERY_ONE = `*[_type == "book" && _id == $id][0] {_id, _type, title, subtitle, blurb}`

function Frame({spec, perspective, onStatus}: {spec: FrameSpec; perspective: 'drafts' | 'published'; onStatus: (id: string, s: Partial<FrameStatus>) => void}) {
  const studioClient = useClient({apiVersion: 'X'})
  const iframe = useRef<HTMLIFrameElement | null>(null)
  const channel = useRef<ReturnType<ReturnType<typeof createController>['createChannel']> | null>(null)
  const [loaded, setLoaded] = useState(false)
  const src = useMemo(() => `${PREVIEW}?mode=grid&frame=${spec.id}&route=${encodeURIComponent(spec.route)}`, [spec.id, spec.route])

  // One controller and one channel per iframe.
  useEffect(() => {
    const target = iframe.current?.contentWindow
    if (!loaded || !target) return undefined
    const controller = createController({targetOrigin: ORIGIN})
    controller.addTarget(target)
    const comlink = controller.createChannel(
      {name: 'presentation', heartbeat: true, connectTo: 'visual-editing'},
      createConnectionMachine().provide({actors: createCompatibilityActors()}),
    )
    channel.current = comlink as never
    let requests = 0
    const stopFetch = (comlink as any).on('visual-editing/fetch-perspective', () => {
      requests += 1
      onStatus(spec.id, {fetchPerspectiveRequests: requests})
      return {perspective, variant: spec.variant}
    })
    const stopStatus = (comlink as any).onStatus?.((status: string) => onStatus(spec.id, {channel: status === 'connected' ? 'connected' : 'connecting'}))
    const stop = comlink.start()
    return () => {
      stopFetch?.()
      stopStatus?.()
      stop()
      controller.destroy()
      channel.current = null
    }
    // The channel is created once per loaded iframe; perspective and variant changes are posted below.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- spike
  }, [loaded])

  // Post the perspective and variant to this frame's channel whenever they change.
  useEffect(() => {
    const id = window.setInterval(() => {
      ;(channel.current as any)?.post?.('presentation/perspective', {perspective, variant: spec.variant})
    }, 1500)
    return () => window.clearInterval(id)
  }, [perspective, spec.variant])

  // Fetch this frame's data with the editor's session (variant + perspective) and push it to the frame.
  useEffect(() => {
    if (!loaded) return undefined
    let cancelled = false
    const client = studioClient.withConfig({apiVersion: 'X', perspective, useCdn: false})
    const run = async () => {
      const isBook = spec.route.startsWith('book:')
      const data = await client.fetch(isBook ? QUERY_ONE : QUERY_LIST, isBook ? {id: spec.route.slice(5)} : {}, {perspective, variant: spec.variant} as never)
      if (!cancelled) iframe.current?.contentWindow?.postMessage({type: 'grid-data', frame: spec.id, data}, ORIGIN)
    }
    void run()
    const timer = window.setInterval(run, 4000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [loaded, perspective, spec.route, spec.variant, studioClient, spec.id])

  const width = spec.viewport === 'phone' ? 390 : 640
  return (
    <Stack gap={2} style={{flex: 'none', width}}>
      <Text muted size={0}>
        {spec.id} · {spec.route} · {spec.variant ?? 'base'}
      </Text>
      <iframe
        onLoad={() => setLoaded(true)}
        ref={iframe}
        src={src}
        style={{background: 'white', border: '1px solid var(--card-border-color)', borderRadius: 6, height: spec.viewport === 'phone' ? 680 : 520, width}}
        title={spec.id}
      />
    </Stack>
  )
}

function Grid() {
  const [layout, setLayout] = useState<keyof typeof LAYOUTS>('Compare')
  const [perspective, setPerspective] = useState<'drafts' | 'published'>('drafts')
  const [status, setStatus] = useState<Record<string, FrameStatus>>({})
  const onStatus = (id: string, s: Partial<FrameStatus>) =>
    setStatus((prev) => ({...prev, [id]: Object.assign({channel: 'connecting', perspectivePosted: 0, fetchPerspectiveRequests: 0}, prev[id], s) as FrameStatus}))
  ;(window as unknown as {__grid?: unknown}).__grid = status

  return (
    <Box padding={4} style={{height: '100%', overflow: 'auto'}}>
      <Stack gap={4}>
        <Heading size={2}>Presentation grid (spike)</Heading>
        <Flex gap={2} wrap="wrap">
          {Object.keys(LAYOUTS).map((name) => (
            <Button key={name} mode={layout === name ? 'default' : 'ghost'} onClick={() => setLayout(name)} text={name} tone={layout === name ? 'primary' : 'default'} />
          ))}
          <Button mode={perspective === 'drafts' ? 'default' : 'ghost'} onClick={() => setPerspective('drafts')} text="Drafts" />
          <Button mode={perspective === 'published' ? 'default' : 'ghost'} onClick={() => setPerspective('published')} text="Published" />
        </Flex>
        <Flex data-testid="grid-frames" gap={3} style={{overflowX: 'auto'}}>
          {LAYOUTS[layout].map((spec) => (
            <Frame key={`${layout}-${spec.id}`} onStatus={onStatus} perspective={perspective} spec={spec} />
          ))}
        </Flex>
        <Card border padding={3} radius={2}>
          <Text data-testid="grid-status" size={0}>
            {JSON.stringify(status)}
          </Text>
        </Card>
      </Stack>
    </Box>
  )
}

export const presentationGridTool: Tool = {
  name: 'presentation-grid',
  title: 'Presentation grid',
  icon: ThLargeIcon,
  component: Grid,
}
