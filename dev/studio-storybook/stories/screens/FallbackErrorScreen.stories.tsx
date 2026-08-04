import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FallbackErrorScreen} from '../../../../packages/sanity/src/core/studio/screens/FallbackErrorScreen'
import {ScreenFrame} from '../../lib/screenFrame'
import {WithStudioProviders} from '../../lib/testProvider'

function makeError(message: string, frames: string[]): Error {
  const error = new Error(message)
  error.stack = [`Error: ${message}`, ...frames.map((f) => `    at ${f}`)].join('\n')
  return error
}

const renderError = makeError("Cannot read properties of undefined (reading 'schemaType')", [
  'DocumentPaneProvider (studio/structure/panes/document/DocumentPaneProvider.tsx:214:31)',
  'renderWithHooks (react-dom/cjs/react-dom.development.js:16305:18)',
  'mountIndeterminateComponent (react-dom/cjs/react-dom.development.js:20074:13)',
])

const meta: Meta<typeof FallbackErrorScreen> = {
  title: 'Navbar & Shell/Screens/Fallback Error',
  component: FallbackErrorScreen,
  decorators: [WithStudioProviders()],
  args: {error: renderError, onReset: () => undefined},
  render: (args) => (
    <ScreenFrame height={620}>
      <FallbackErrorScreen {...args} />
    </ScreenFrame>
  ),
  parameters: {
    // Args are Error/callback objects, not UI-controllable values; each story fixes its own.
    controls: {include: []},
    docs: {
      description: {
        component: [
          "FallbackErrorScreen is the last screen: when an error reaches the studio's top-level " +
            'boundary and nothing else has handled it, this is what replaces the entire ' +
            'interface.',
          '',
          '|        |                                                                   |',
          '| ------ | ----------------------------------------------------------------- |',
          '| Source | `packages/sanity/src/core/studio/screens/FallbackErrorScreen.tsx` |',
          '| Tier   | SERVICE                                                           |',
          '',
          'Unlike every other screen in this family it does not know what went wrong. It has an ' +
            '`Error` object, possibly an error-reporting event id, and a reset callback, and it ' +
            'has to be useful with only that.',
          '',
          '> **Why it matters:** the screen shows two entirely different things to two ' +
            'audiences, chosen at build time. In development it prints the message and the full ' +
            'stack in a critical card, because the person reading it can fix it. In production it ' +
            'prints neither, and instead says: copy the error details and give them to your ' +
            'development team or Sanity Support. That is not the same screen with a detail ' +
            'hidden, it is a different design for a different reader, and it means the screen you ' +
            'debug against is never the screen your users saw. Worth holding onto when a bug ' +
            'report describes this page.',
          '',
          '**The developer tip is the interesting part.** When the error is a client REQUEST ' +
            'error - a network failure, a 5xx, a 429, an expired session - the screen adds a ' +
            'dev-only card saying, in effect: this should not have got here. It then shows the ' +
            '`useStudioErrorHandler` snippet that would have handled it locally. A transient ' +
            'network blip should degrade a panel, not blank the studio, and rather than fix that ' +
            'centrally the screen teaches the pattern at the moment the mistake becomes visible. ' +
            'That is documentation placed where it is needed instead of where it is filed.',
          '',
          '**Harness note:** `isDev` / `isProd` are resolved at build time from the bundler ' +
            'environment, so which branch you see depends on how this storybook was built - the ' +
            'dev server shows the developer view, a static build shows the production one. Both ' +
            'are described below so the page reads correctly either way.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:shell',
    'chapter:lawsofux',
    'pattern:error-messages',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof FallbackErrorScreen>

export const Default: Story = {
  name: 'An unrecoverable error',
  parameters: {
    docs: {
      description: {
        story:
          'A React render error that reached the boundary. `ErrorActions` at the bottom is the part that works in every build: it can copy the error details to the clipboard and retry via `onReset`, which remounts the subtree rather than reloading the page.',
      },
    },
  },
}

export const WithEventId: Story = {
  name: 'With an error-reporting event ID',
  args: {eventId: 'c7d9182f4ae3b650'},
  parameters: {
    docs: {
      description: {
        story:
          'With error reporting configured, the report id travels with the error so a support conversation can start from the same record the developer is looking at. Like the stack, it is rendered only in development - which is a real gap, since the production copy explicitly asks the user to share error details.',
      },
    },
  },
}

export const CustomHeading: Story = {
  name: 'With a caller-supplied heading',
  args: {heading: 'This tool failed to load'},
  parameters: {
    docs: {
      description: {
        story:
          '`heading` lets a boundary lower down the tree say which part failed, instead of the generic "An error occurred". Small change, large difference in what the reader does next: "the studio broke" sends them to support, "this tool broke" sends them to another tool.',
      },
    },
  },
}

export const RequestError: Story = {
  name: 'A request error that should not have reached here',
  args: {
    error: Object.assign(
      makeError('Request error: 503 Service Unavailable', [
        'onResponse (@sanity/client/dist/index.js:1:20481)',
        'fetchDocuments (studio/core/store/_legacy/document/document-store.ts:88:14)',
      ]),
      {statusCode: 503, response: {statusCode: 503, body: {error: 'Service Unavailable'}}},
    ),
    onReset: () => undefined,
  },
  parameters: {
    docs: {
      description: {
        story: [
          'A 503 that nothing caught. `isClientRequestError` recognises it and, in a ' +
            'development build, the screen appends a caution card explaining that recoverable ' +
            'request errors should be handled at the call site, with the ' +
            '`useStudioErrorHandler` snippet that does it.',
          '',
          'The judgment behind this is that a transient 503 taking down the whole studio is ' +
            'an application-authoring bug, not a platform failure, and the screen chooses to ' +
            'say so to the only audience that can act on it. In a production build this card ' +
            'does not render, and an editor sees the ordinary unrecoverable-error page.',
        ].join('\n'),
      },
    },
  },
}
