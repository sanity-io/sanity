import {SyncIcon} from '@sanity/icons/Sync'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Button, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ErrorInfo, useCallback, useState} from 'react'

// ErrorBoundary IS re-exported from the `sanity` ui-components barrel, so it is
// imported the same way call sites import it (matching Button.stories). The
// Studio wrapper routes uncaught render errors to the active source's
// `onUncaughtError` handler and then forwards to any `onCatch` prop; on a caught
// error the underlying @sanity/ui boundary renders `<Code>{error.message}</Code>`
// and has NO built-in reset — recovery is done by remounting the boundary.
import {ErrorBoundary} from '../../../../packages/sanity/src/ui-components/errorBoundary/ErrorBoundary'

const CRASH_MESSAGE = "Cannot read properties of undefined (reading 'title')"

/** A child that throws during render when `crash` is true. */
function Bomb({crash}: {crash: boolean}) {
  if (crash) throw new Error(CRASH_MESSAGE)
  return (
    <Text size={1}>Child rendered successfully. Trigger the error to throw during render.</Text>
  )
}

const logCatch = ({error, info}: {error: Error; info: ErrorInfo}) =>
  console.error('ErrorBoundary caught:', error, info)

/**
 * Trigger a render error and watch the boundary catch it. The trigger button
 * lives outside the boundary so it stays interactive after the child is
 * replaced by the caught state.
 */
function CaughtDemo() {
  const [crash, setCrash] = useState(false)
  const [boundaryKey, setBoundaryKey] = useState(0)

  // The @sanity/ui ErrorBoundary has no reset API: once it has caught, it keeps
  // showing the caught state until it is remounted. Clearing `crash` alone leaves
  // the stale error on screen. Bump the boundary's `key` so React remounts it (and
  // the child re-mounts fresh), which is exactly what the Recommended story does.
  const reset = useCallback(() => {
    setCrash(false)
    setBoundaryKey((k) => k + 1)
  }, [])

  return (
    <Stack gap={3}>
      <Flex gap={2}>
        <Button
          text="Trigger render error"
          tone="critical"
          onClick={() => setCrash(true)}
          disabled={crash}
        />
        <Button text="Reset" mode="ghost" onClick={reset} disabled={!crash} />
      </Flex>
      <Card border padding={3} radius={2}>
        <ErrorBoundary key={boundaryKey} onCatch={logCatch}>
          <Bomb crash={crash} />
        </ErrorBoundary>
      </Card>
    </Stack>
  )
}

/**
 * Audit `error-messages` — Current: the native caught surface is a raw `<Code>`
 * dump of the thrown message, with no explanation and no way to recover.
 */
function CurrentDemo() {
  const [crash, setCrash] = useState(false)
  return (
    <Stack gap={3}>
      <Button
        text="Trigger render error"
        tone="critical"
        onClick={() => setCrash(true)}
        disabled={crash}
      />
      <Card border padding={3} radius={2}>
        <ErrorBoundary onCatch={logCatch}>
          <Bomb crash={crash} />
        </ErrorBoundary>
      </Card>
      {!crash && (
        <Text size={0} muted>
          Trigger the error to see the raw code-dump fallback.
        </Text>
      )}
    </Stack>
  )
}

/**
 * Audit `error-messages` — Recommended: catch via `onCatch`, then render an
 * actionable fallback (plain-language cause + a "Try again" control that
 * remounts the boundary via a key bump, since the component has no reset API).
 */
function RecommendedDemo() {
  const [crash, setCrash] = useState(false)
  const [caught, setCaught] = useState<Error | null>(null)
  const [boundaryKey, setBoundaryKey] = useState(0)

  const handleCatch = useCallback(({error, info}: {error: Error; info: ErrorInfo}) => {
    logCatch({error, info})
    setCaught(error)
  }, [])

  const retry = useCallback(() => {
    setCaught(null)
    setCrash(false)
    setBoundaryKey((k) => k + 1)
  }, [])

  if (caught) {
    return (
      <Card border padding={4} radius={2} tone="critical">
        <Stack gap={4}>
          <Flex gap={3} align="flex-start">
            <Text size={3}>
              <WarningOutlineIcon />
            </Text>
            <Stack gap={3}>
              <Text size={2} weight="semibold">
                This section couldn’t be displayed
              </Text>
              <Text size={1}>
                Something went wrong while rendering this content. Your other changes are safe. Try
                again, and if it keeps happening, contact support.
              </Text>
              <Box>
                <Code size={0}>{caught.message}</Code>
              </Box>
            </Stack>
          </Flex>
          <Flex gap={2}>
            <Button text="Try again" tone="primary" icon={SyncIcon} onClick={retry} />
            <Button text="Dismiss" mode="ghost" onClick={retry} />
          </Flex>
        </Stack>
      </Card>
    )
  }

  return (
    <Stack gap={3}>
      <Button
        text="Trigger render error"
        tone="critical"
        onClick={() => setCrash(true)}
        disabled={crash}
      />
      <Card border padding={3} radius={2}>
        <ErrorBoundary key={boundaryKey} onCatch={handleCatch}>
          <Bomb crash={crash} />
        </ErrorBoundary>
      </Card>
    </Stack>
  )
}

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Laws & Behaviors/ErrorBoundary',
  component: ErrorBoundary,
  tags: [
    'autodocs',
    'chapter:forms',
    'chapter:lawsofux',
    'pattern:error-messages',
    'audit:needs-work',
    'source:studio-shadow',
    'tier:service',
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'ErrorBoundary keeps a render error from taking down the whole editor. Without it, ' +
            'one component throwing during render (a preview meeting malformed data, a plugin ' +
            'throwing) takes the entire Studio down with it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/ui-components/errorBoundary/ErrorBoundary.tsx`, Studio shadow of `@sanity/ui` `ErrorBoundary` |',
          '| Tier | SERVICE. A cross-cutting resilience wrapper: it catches uncaught render errors from any subtree and routes them to the configured `source.onUncaughtError`, supporting every surface without being the editing core |',
          '| Audit | 🔴 needs-work (`error-messages`). The native caught state is a raw `<Code>` dump of the error message: no plain-language explanation, no next step, no recovery affordance |',
          '| Patterns | `error-messages` |',
          '',
          'ErrorBoundary wraps a subtree, catches the throw, keeps everything around it alive, ' +
            'and hands the error to wherever your workspace wants it logged. It is the difference ' +
            'between "one pane shows an error" and "the editor is gone".',
          '',
          "Studio's `ErrorBoundary` wraps `@sanity/ui`'s boundary, adds routing to the " +
            'workspace `onUncaughtError` config, and forwards to an optional `onCatch` prop. On a ' +
            'caught error the underlying boundary swaps its children for ' +
            '`<Code>{error.message}</Code>`. It has no reset API, recovery requires remounting ' +
            'the boundary (for example bumping a React `key`), which the Recommended story does.',
          '',
          'Addressed for `error-messages` looks like the Current vs Recommended pair: replace ' +
            'the raw code dump with an actionable fallback, what happened in plain language, plus ' +
            'a "Try again" control that remounts the subtree.',
          '',
          '> **Why it matters:** there is no reset method. Once the boundary has caught, it ' +
            'keeps showing the caught state until it is remounted, clearing the error condition ' +
            'alone leaves the stale message on screen. To recover you must force a remount (bump ' +
            "the boundary's React key), which is exactly what the Recommended story does.",
          '',
          'The last story shows the boundary in context: a book document pane whose Author ' +
            'field throws, where the boundary holds the rest of the editor alive and offers ' +
            'recovery in its place.',
        ].join('\n'),
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ErrorBoundary>

export const Caught: Story = {
  render: () => <CaughtDemo />,
}

export const Current: Story = {
  name: 'error-messages · Current (raw code dump)',
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the audit finding: the boundary renders the error message verbatim as a monospace `<Code>` block. Useful to a developer reading a stack trace, opaque to an editor who just wants to keep working.',
      },
    },
  },
  render: () => <CurrentDemo />,
}

export const Recommended: Story = {
  name: 'error-messages · Recommended (actionable + retry)',
  parameters: {
    docs: {
      description: {
        story:
          'The resolved state: `onCatch` lifts the error to the parent, which renders a designed fallback, what happened in plain language plus a "Try again" button that remounts the subtree (bumping a React `key`, because the boundary exposes no reset). The raw message is still available for anyone who wants it.',
      },
    },
  },
  render: () => <RecommendedDemo />,
}

/**
 * The whole point of a boundary, in the place it earns its keep: the "Anna
 * Karenina" book pane, mid-edit, when one field's renderer throws. The Title above
 * the boundary keeps working — only the broken Author subtree is swapped for the
 * recovery UI, so a single bad preview costs one section, not the whole editor.
 * Break the field, then recover with Try again (which remounts the boundary, since
 * it has no reset).
 */
function InContextDemo() {
  const [crash, setCrash] = useState(false)
  const [caught, setCaught] = useState<Error | null>(null)
  const [boundaryKey, setBoundaryKey] = useState(0)

  const handleCatch = useCallback(({error, info}: {error: Error; info: ErrorInfo}) => {
    logCatch({error, info})
    setCaught(error)
  }, [])

  const retry = useCallback(() => {
    setCaught(null)
    setCrash(false)
    setBoundaryKey((k) => k + 1)
  }, [])

  return (
    <Card border radius={2} shadow={1} style={{maxWidth: 480}}>
      <Flex
        align="center"
        justify="space-between"
        padding={3}
        style={{borderBottom: '1px solid var(--card-border-color)'}}
      >
        <Stack gap={2}>
          <Text size={1} weight="semibold">
            Anna Karenina
          </Text>
          <Text size={0} muted>
            Book · Draft
          </Text>
        </Stack>
        <Button
          text="Simulate a broken field"
          tone="critical"
          mode="ghost"
          onClick={() => setCrash(true)}
          disabled={crash}
        />
      </Flex>
      <Stack gap={4} padding={4}>
        <Stack gap={2}>
          <Text size={0} weight="medium" muted>
            Title
          </Text>
          <Card border radius={2} padding={3}>
            <Text size={1}>Anna Karenina</Text>
          </Card>
        </Stack>
        <Stack gap={2}>
          <Text size={0} weight="medium" muted>
            Author
          </Text>
          {caught ? (
            <Card border padding={4} radius={2} tone="critical">
              <Stack gap={4}>
                <Flex gap={3} align="flex-start">
                  <Text size={3}>
                    <WarningOutlineIcon />
                  </Text>
                  <Stack gap={3}>
                    <Text size={2} weight="semibold">
                      This field couldn’t be displayed
                    </Text>
                    <Text size={1}>
                      Something went wrong while rendering this field. Your other changes to this
                      document are safe. Try again, and if it keeps happening, contact support.
                    </Text>
                    <Box>
                      <Code size={0}>{caught.message}</Code>
                    </Box>
                  </Stack>
                </Flex>
                <Flex gap={2}>
                  <Button text="Try again" tone="primary" icon={SyncIcon} onClick={retry} />
                </Flex>
              </Stack>
            </Card>
          ) : (
            <Card border radius={2} padding={3}>
              <ErrorBoundary key={boundaryKey} onCatch={handleCatch}>
                <Bomb crash={crash} />
              </ErrorBoundary>
            </Card>
          )}
        </Stack>
      </Stack>
    </Card>
  )
}

export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => <InContextDemo />,
}
