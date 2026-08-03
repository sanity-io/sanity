// @ts-expect-error -- @sanity/comlink is a dependency of packages/sanity, not of this workspace
// package; .storybook/main.ts aliases the bare specifier to the real dist path for the actual
// bundle (so this resolves and runs fine), but tsc has no visibility into that Vite-level alias.
import {createNode, createNodeMachine} from '@sanity/comlink'
import {Box, Card, Container, Heading, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useEffect, useState} from 'react'

/**
 * A LOCAL PREVIEW TARGET for the Presentation tool, served from this storybook.
 *
 * ## Why it is a story rather than a separate app
 *
 * `Preview` renders an iframe and opens a `@sanity/comlink` channel to whatever loads inside it.
 * Storying it therefore needs a front end - which is why it sat uncovered until Faheem asked for
 * one to be wired up (2026-07-26).
 *
 * Standing up a real Next.js app would work and would create a second thing that has to be running
 * for these stories to pass, in CI and in the portable tarball. Storybook already serves every
 * story at `iframe.html?id=…` on the SAME ORIGIN, so this page is the target instead: no extra
 * server, no extra process, and it ships with the static build automatically because it is just
 * another story.
 *
 * ## What is real here
 *
 * The comlink handshake. `Preview` creates a controller channel `{name: 'presentation', connectTo:
 * 'visual-editing'}`; this page creates the matching node `{name: 'visual-editing', connectTo:
 * 'presentation'}`. That is the actual protocol, so the connection genuinely completes and the
 * Presentation machine genuinely transitions out of `loading`.
 *
 * ## What is not
 *
 * Visual editing itself. A real front end wraps its content in stega-encoded values and
 * click-to-edit overlays; this page renders a plain document and answers the handshake. So the
 * connection is real, the *editing* is not, and the stories say which is which rather than
 * implying the whole loop works.
 */

const CHANNEL_NAME = 'visual-editing'
const CONNECT_TO = 'presentation'

function useComlinkNode() {
  // Whether we are embedded is knowable at first render, so it belongs in the INITIAL state
  // rather than in the effect. Setting it inside the effect works and triggers a second render
  // for a fact that never changes - which is what the React Compiler's EffectSetState rule
  // objects to, correctly.
  const [status, setStatus] = useState<string>(() =>
    window.parent === window ? 'not embedded' : 'idle',
  )

  useEffect(() => {
    // Only meaningful inside an iframe - as a top-level page there is nobody to hand shake with,
    // which is exactly what the standalone story below demonstrates.
    if (window.parent === window) return undefined

    const node = createNode(
      {name: CHANNEL_NAME, connectTo: CONNECT_TO},
      createNodeMachine() as never,
    )

    const unsubscribe = node.onStatus((next: string) => setStatus(String(next)))
    node.start()

    return () => {
      unsubscribe?.()
      node.stop()
    }
  }, [])

  return status
}

function TargetPage({path = '/blog/hello'}: {path?: string}) {
  const status = useComlinkNode()

  return (
    <Card height="fill" padding={5} tone="transparent" style={{minHeight: 480}}>
      <Container width={1}>
        <Stack gap={5}>
          <Card
            padding={2}
            radius={2}
            border
            tone={status === 'connected' ? 'positive' : 'caution'}
          >
            <Text size={0} weight="medium" align="center">
              comlink: {status}
            </Text>
          </Card>

          <Stack gap={4}>
            <Text size={0} muted>
              {path}
            </Text>
            <Heading size={3}>The quiet rise of structured content</Heading>
            <Text size={2} muted>
              A short look at why teams move away from page builders.
            </Text>
          </Stack>

          <Box>
            <Text size={1}>
              This is a stand-in front end served by the storybook itself, so the Presentation
              stories have something to point an iframe at without a second server running. The
              comlink handshake above is real; the visual-editing overlays a production front end
              would add are not.
            </Text>
          </Box>
        </Stack>
      </Container>
    </Card>
  )
}

const meta: Meta = {
  title: 'Overlays & Navigation/Preview Target',
  parameters: {
    layout: 'fullscreen',
    padding: 0,
    controls: {include: []},
    docs: {
      description: {
        component: [
          "Storying the Presentation tool's iframe needs something real to load into it, so " +
            'rather than stand up a second server, this page serves itself: same origin, no ' +
            'extra process, ships with the static build for free.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `dev/studio-storybook/stories/presentation/PreviewTarget.stories.tsx` (harness, not Studio code) |',
          '| Tier | harness |',
          '',
          '`Preview` opens a `@sanity/comlink` channel to whatever loads in its iframe, so storying it needs a front end. A real Next.js app would work and would become a second process that has to be running for these stories to pass, in CI and in the portable tarball. Storybook already serves every story at `iframe.html?id=…` on the same origin, so the target is just another story: no extra server, and it ships with the static build for free.',
          '',
          '> **Why it matters:** the handshake is real. `Preview` creates the controller channel and this page creates the matching node, using the actual protocol, so the Presentation machine genuinely leaves its loading state. But visual editing itself is not: a production front end wraps content in stega-encoded values and click-to-edit overlays, and this page renders a plain document that only answers the handshake. The connection is real; the editing loop is not, and the Presentation stories say so rather than implying otherwise.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:overlays', 'source:harness', 'tier:chrome'],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'The target page',
  parameters: {
    docs: {
      description: {
        story:
          'Opened directly, outside an iframe, the status reads **not embedded** - there is no parent to hand shake with, and the node is not started. That is the correct behaviour rather than a failure, and it is what you are looking at right now.\n\nTo see it connected, open the Presentation stories, which load this page in the Preview iframe.',
      },
    },
  },
  render: () => <TargetPage />,
}

export const AlternateRoute: Story = {
  name: 'A different route',
  parameters: {
    docs: {
      description: {
        story:
          'The same target reporting a different path, so a Presentation story can demonstrate navigation between two routes without either of them being a real page.',
      },
    },
  },
  render: () => <TargetPage path="/blog/structured-content-models" />,
}
