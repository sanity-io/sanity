import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useEffect, useState} from 'react'

import {ImportErrorScreen} from '../../../../packages/sanity/src/core/studio/screens/ImportErrorScreen'
import {ScreenFrame} from '../../lib/screenFrame'

/**
 * A realistic dynamic-import failure. The message and stack are the shape a browser actually
 * produces for a chunk that 404s after a redeploy, which is the situation this screen exists for:
 * the studio was loaded from build A, build B replaced it, and the chunk build A wants is gone.
 */
function importError(): Error {
  const error = new Error(
    'Failed to fetch dynamically imported module: https://studio.example.com/static/StructureTool-a3f9c1.js',
  )
  error.stack = [
    'TypeError: Failed to fetch dynamically imported module: https://studio.example.com/static/StructureTool-a3f9c1.js',
    '    at __vitePreload (https://studio.example.com/static/index-9d2b4e.js:1:4821)',
    '    at loadTool (https://studio.example.com/static/index-9d2b4e.js:1:88214)',
    '    at renderStudio (https://studio.example.com/static/index-9d2b4e.js:1:91002)',
  ].join('\n')
  return error
}

const meta: Meta<typeof ImportErrorScreen> = {
  title: 'Navbar & Shell/Screens/Import Error',
  component: ImportErrorScreen,
  args: {error: importError()},
  render: (args) => (
    <ScreenFrame height={560}>
      <ImportErrorScreen {...args} />
    </ScreenFrame>
  ),
  parameters: {
    // `error` and `eventId` are fixed per story to reproduce a specific failure; not values
    // meant for free-form controls.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'ImportErrorScreen is the screen for a failed dynamic import: the studio tried to ' +
            'load a chunk and could not.',
          '',
          '|        |                                                                 |',
          '| ------ | --------------------------------------------------------------- |',
          '| Source | `packages/sanity/src/core/studio/screens/ImportErrorScreen.tsx` |',
          '| Tier   | CHROME                                                          |',
          '',
          'Almost always caused by a redeploy: a browser holding an old build asks for a chunk ' +
            'hash that no longer exists on the server. The fix is a reload, and the screen knows ' +
            'that.',
          '',
          '> **Why it matters:** this is one of very few error screens anywhere that can ' +
            'honestly say "the way to fix this is to reload", and it is built around that ' +
            'certainty. With auto-reload set it does not just offer the button, it counts down ' +
            'from five and reloads on its own, a self-healing error state. That is only ' +
            'defensible because the diagnosis is reliable: a missing chunk after a deploy is ' +
            'fixed by fetching the new index, every time. Compare the fallback error screen, ' +
            'which faces an error it cannot classify and therefore offers no automatic anything.',
          '',
          '**A detail with real consequences:** the stack trace is rendered only when `isDev`. ' +
            'In a production studio an editor sees a heading, a sentence, and a Reload button - ' +
            'no message, no stack. That is a deliberate trade (stack traces are noise to an ' +
            'editor and leak build paths) and it means the screen you debug is never the screen ' +
            'your users saw.',
          '',
          '**Harness note:** `isDev` is resolved at build time from the bundler environment, so ' +
            'which branch these stories show depends on how the storybook was built - the dev ' +
            'server shows the developer view, a static build shows the production one. The ' +
            'stories are written to be read either way, and the difference is itself worth ' +
            'noticing.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:shell',
    'pattern:error-messages',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof ImportErrorScreen>

export const Default: Story = {
  name: 'Import failed',
  parameters: {
    docs: {
      description: {
        story:
          'The resting state: an explanation and a Reload button, waiting for the user to act. In a development build the error message and stack appear in a critical-toned card below the text; in a production build they do not.',
      },
    },
  },
}

export const WithEventId: Story = {
  name: 'With an event ID',
  args: {eventId: 'a41f8c2e9b7d4f10'},
  parameters: {
    docs: {
      description: {
        story:
          'When error reporting is wired up, the report id is rendered alongside the stack so it can be quoted in a support conversation. Note it shares the `isDev` gate with the stack - so the identifier that exists specifically to be passed to somebody else is hidden in exactly the build where a user would need to pass it.',
      },
    },
  },
}

/**
 * Runs the real countdown and unmounts the screen before it reaches zero.
 *
 * At zero, `ImportErrorScreen` calls `window.location.reload()`. In a storybook that reloads the
 * storybook - and because the story remounts on reload and starts counting again, it is not a
 * one-off annoyance but an infinite five-second reload loop, on the canvas AND on the docs page
 * that renders every story of this component together.
 *
 * `window.location.reload` cannot be stubbed in Chrome, so the only way to show the live countdown
 * safely is to take the component away before it fires. Three and a half seconds is enough to
 * watch 5 tick down to 2, which is the whole thing worth seeing.
 */
function CountdownUntilJustBeforeReload({error}: {error: Error}) {
  const [mounted, setMounted] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setMounted(false), 3500)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return (
      <Card height="fill" padding={4} tone="transparent">
        <Stack gap={3}>
          <Text size={1} weight="medium">
            Countdown stopped at 2s
          </Text>
          <Text size={1} muted>
            The screen was unmounted deliberately. Had it been allowed to reach zero it would have
            called <code>window.location.reload()</code>, reloading this storybook and starting the
            countdown again - a five-second reload loop. Reload the story to watch it once more.
          </Text>
        </Stack>
      </Card>
    )
  }
  return <ImportErrorScreen error={error} autoReload />
}

export const AutoReloading: Story = {
  name: 'Auto-reloading (live countdown)',
  parameters: {
    docs: {
      description: {
        story:
          'Watch the text: "Reloading in 5s…" ticks down once a second, driven by a real `rxjs` `timer`, and the button relabels to "Reload now". The countdown is live, not a screenshot of one.\n\nIt is cut short at two seconds on purpose. At zero the component calls `window.location.reload()`, which here would reload the storybook and restart the countdown - an endless loop, and one that would take the docs page with it. `window.location.reload` cannot be stubbed in Chrome, so the harness unmounts the screen instead. The countdown you are watching is real; the reload at the end of it is described rather than performed.\n\nThis is a self-healing error state, and it is the only one in the studio. It is affordable because the diagnosis is reliable: a chunk that 404s after a redeploy is fixed by fetching the new index, every time.',
      },
    },
  },
  render: (args) => (
    <ScreenFrame height={560}>
      <CountdownUntilJustBeforeReload error={args.error} />
    </ScreenFrame>
  ),
}
