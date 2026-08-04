import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useRef, useState} from 'react'

import {PreviewHeader} from '../../../../packages/sanity/src/presentation/preview/PreviewHeader'
import {
  createControllableActorRef,
  createFakeActorRef,
  presentationActorStates,
  previewUrlActorStates,
} from '../../lib/fakeActorRef'
import {WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

/**
 * Everything the toolbar needs that is NOT an actor. All plain data or callbacks - which is the
 * point: once the two machines are supplied, the rest of this component is an ordinary props-in
 * toolbar.
 */
function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    // Share-preview OFF, and this is a real configuration rather than a convenience: shared
    // preview access is opt-in, so plenty of studios run exactly like this.
    //
    // It is also the honest boundary. `SharePreviewMenu` is not a control the toolbar renders
    // from input - it fetches and subscribes to shared-access tokens through the live client,
    // which makes it a data-fetching subtree with its own requirements. Faking a client far
    // enough to satisfy it would be storying the fixture rather than the feature, which is the
    // line this catalog does not cross. The share menu is therefore NOT storied; every other
    // control on the toolbar is.
    canSharePreviewAccess: false,
    canToggleSharePreviewAccess: false,
    canUseSharedPreviewAccess: false,
    initialUrl: new URL('https://example.com/blog/hello'),
    loadersConnection: 'connected' as const,
    navigatorEnabled: false,
    onPathChange: noop,
    onRefresh: noop,
    openPopup: noop,
    overlaysConnection: 'connected' as const,
    perspective: 'drafts' as const,
    variant: undefined,
    previewUrl: 'https://example.com/blog/hello',
    setViewport: noop,
    targetOrigin: 'https://example.com',
    toggleNavigator: noop,
    toggleOverlay: noop,
    viewport: 'desktop' as const,
    vercelProtectionBypass: null,
    handlesPerspectiveChange: true,
    handlesVariantChange: false,
    ...overrides,
  }
}

function Bar({children}: {children: React.ReactNode}) {
  return (
    <Card border radius={2} overflow="hidden" style={{maxWidth: 900}}>
      {children}
    </Card>
  )
}

/** Supplies the iframe ref the toolbar holds but, in these states, never reads. */
function HeaderStage({
  presentationState,
  previewUrlState = previewUrlActorStates.idle,
  props = {},
}: {
  presentationState: Record<string, unknown>
  previewUrlState?: Record<string, unknown>
  props?: Record<string, unknown>
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  return (
    <Bar>
      <PreviewHeader
        {...baseProps(props)}
        iframeRef={iframeRef}
        presentationRef={createFakeActorRef(presentationState) as never}
        previewUrlRef={createFakeActorRef(previewUrlState) as never}
      />
    </Bar>
  )
}

const meta: Meta = {
  title: 'Overlays & Navigation/Preview Header',
  decorators: [WithStudioProviders()],
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'PreviewHeader is the toolbar every Presentation user touches constantly: the URL ' +
            'field, the viewport toggle, the overlay toggle, refresh, and the share and ' +
            'open-in-new-tab controls all live here, reflecting connection state as it changes ' +
            'underneath them.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/presentation/preview/PreviewHeader.tsx` |',
          '| Tier | SERVICE |',
          '| Patterns | `visible-system-state` |',
          '',
          'It was the last significant gap in the catalog, and it needed one piece of harness ' +
            'that did not exist: a fake XState actor ref.',
          '',
          '**Not storied: the share-preview menu.** `SharePreviewMenu` subscribes to the live ' +
            'client for shared-access tokens, a data-fetching subtree rather than a control ' +
            'reflecting input, so these stories run with share access off, which is itself a ' +
            'common studio configuration. Everything else on the toolbar is covered.',
          '',
          'What `useSelector` actually needs, and therefore the whole surface ' +
            "`lib/fakeActorRef.ts` has to satisfy, is four things: `matches('loading')` for flat " +
            "states, `matches({loaded: 'reloading'})` for nested ones, `context.<field>`, and " +
            "`hasTag('busy')` on the separate preview-url machine. The nested form is the one " +
            "worth care, `matches('loaded')` must also be true while the machine is in `{loaded: " +
            "'reloading'}`, and getting that wrong shows the wrong buttons with no error.",
          '',
          '> **Why it matters:** the rule for stubbing is to fake a dependency the component ' +
            'reads as input, and refuse when the thing stubbed is what the story tests. This ' +
            'toolbar is squarely the first kind: its job is laying out controls and reflecting ' +
            "connection state, the state machine is the input it reflects, and the machine's own " +
            "transitions are covered by the machine's own tests. Faking the actor lets a story " +
            'pin what the toolbar looks like while reloading, which is otherwise unreachable ' +
            'without a live iframe and a live connection to a running front end.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:overlays',
    'pattern:visible-system-state',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const Loaded: Story = {
  name: 'Loaded',
  parameters: {
    docs: {
      description: {
        story:
          'The resting state. The preview has connected and rendered, so every control is live: the URL field shows the current route, the viewport and overlay toggles are available, refresh is idle.',
      },
    },
  },
  render: () => <HeaderStage presentationState={presentationActorStates.loaded} />,
}

export const Loading: Story = {
  name: 'Loading',
  parameters: {
    docs: {
      description: {
        story:
          'Before the front end has answered. This is the state an editor sees when their ' +
          'preview URL is wrong or their dev server is down - the toolbar is the only thing on ' +
          'screen still telling them anything.',
      },
    },
  },
  render: () => <HeaderStage presentationState={presentationActorStates.loading} />,
}

export const Refreshing: Story = {
  name: 'Refreshing',
  parameters: {
    docs: {
      description: {
        story:
          "A soft refresh, expressed as the nested state `{loaded: 'refreshing'}`. Note the machine is still *loaded* - the existing preview stays on screen while the refresh runs, so `matches('loaded')` must remain true. That nesting is why the fake actor implements parent matching rather than string equality.",
      },
    },
  },
  render: () => <HeaderStage presentationState={presentationActorStates.refreshing} />,
}

export const Reloading: Story = {
  name: 'Reloading',
  parameters: {
    docs: {
      description: {
        story:
          "A hard reload of the iframe - `{loaded: 'reloading'}`. Distinct from refreshing: refreshing asks the front end to re-render, reloading throws the document away and starts again. Different spinner, different cost, and the toolbar distinguishes them.",
      },
    },
  },
  render: () => <HeaderStage presentationState={presentationActorStates.reloading} />,
}

export const OverlaysEnabled: Story = {
  name: 'Visual editing overlays on',
  parameters: {
    docs: {
      description: {
        story:
          'The overlay toggle reflects `context.visualEditingOverlaysEnabled` - the one piece of machine *context* the toolbar reads, as opposed to machine state. Compare with the Loaded story: same state, different context, different button.',
      },
    },
  },
  render: () => <HeaderStage presentationState={presentationActorStates.loadedWithOverlays} />,
}

export const PreviewUrlBusy: Story = {
  name: 'The preview URL is changing',
  parameters: {
    docs: {
      description: {
        story:
          "A second machine, and the only thing the toolbar asks it is `hasTag('busy')`. When the preview-url machine is busy it is about to change the target origin and reload the iframe, so the URL field shows a spinner rather than accepting input.\n\nTwo machines for one toolbar looks like over-engineering until you see this state: the preview can be perfectly loaded while the URL is mid-change, and one machine could not express both.",
      },
    },
  },
  render: () => (
    <HeaderStage
      presentationState={presentationActorStates.loaded}
      previewUrlState={previewUrlActorStates.busy}
    />
  ),
}

export const MobileViewport: Story = {
  name: 'Mobile viewport',
  parameters: {
    docs: {
      description: {
        story:
          'The viewport toggle set to mobile. A plain prop rather than machine state, because the viewport is a studio preference rather than something the preview connection knows about.',
      },
    },
  },
  render: () => (
    <HeaderStage presentationState={presentationActorStates.loaded} props={{viewport: 'mobile'}} />
  ),
}

export const Disconnected: Story = {
  name: 'Overlays disconnected',
  parameters: {
    docs: {
      description: {
        story:
          'The preview is loaded but the overlays connection has dropped - the front end is rendering, and click-to-edit is not working. A state that is easy to miss in development because it usually resolves itself, and confusing in the wild because the page looks fine.',
      },
    },
  },
  render: () => (
    <HeaderStage
      presentationState={presentationActorStates.loaded}
      props={{overlaysConnection: 'reconnecting', loadersConnection: 'reconnecting'}}
    />
  ),
}

export const Transitioning: Story = {
  name: 'Driving a transition',
  parameters: {
    docs: {
      description: {
        story:
          'The other kind of actor stub: one whose snapshot can be replaced, so a story can drive a transition rather than pin a state. Press the button and the toolbar moves from loaded to reloading and back, with `useSelector` re-rendering the way it would against a real machine.\n\nUse `createControllableActorRef` when the story is about the toolbar **changing**; `createFakeActorRef` when it is about one state.',
      },
    },
  },
  render: function TransitioningStory() {
    const iframeRef = useRef<HTMLIFrameElement | null>(null)
    const [actor] = useState(() => createControllableActorRef(presentationActorStates.loaded))
    const [isReloading, setIsReloading] = useState(false)
    return (
      <Stack gap={4}>
        <Bar>
          <PreviewHeader
            {...baseProps()}
            iframeRef={iframeRef}
            presentationRef={actor as never}
            previewUrlRef={createFakeActorRef(previewUrlActorStates.idle) as never}
          />
        </Bar>
        <button
          type="button"
          onClick={() => {
            const next = !isReloading
            setIsReloading(next)
            actor.set(next ? presentationActorStates.reloading : presentationActorStates.loaded)
          }}
        >
          {isReloading ? 'Finish reloading' : 'Start reloading'}
        </button>
        <Text size={0} muted>
          machine state: {isReloading ? '{loaded: reloading}' : 'loaded'}
        </Text>
      </Stack>
    )
  },
}
