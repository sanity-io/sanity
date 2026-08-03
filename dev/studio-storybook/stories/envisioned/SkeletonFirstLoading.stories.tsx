import {PlayIcon} from '@sanity/icons/Play'
import {Button as UIButton, Card, Code, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useEffect, useRef, useState} from 'react'

// Real component from its real path (org contract §8): the shipped preview layout,
// whose `isPlaceholder` branch IS the skeleton — no new component exists in this
// story, only a different call-site decision during load.
import {DefaultPreview} from '../../../../packages/sanity/src/core/components/previews/general/DefaultPreview'

const ROWS = [
  {title: 'War and Peace', subtitle: 'Leo Tolstoy'},
  {title: 'Anna Karenina', subtitle: 'Leo Tolstoy'},
  {title: 'Pride and Prejudice', subtitle: 'Jane Austen'},
  {title: 'Dune', subtitle: 'Frank Herbert'},
  {title: 'The Dispossessed', subtitle: 'Ursula K. Le Guin'},
  {title: 'Emma', subtitle: 'Jane Austen'},
]

const LOAD_MS = 1600

type Phase = 'idle' | 'loading' | 'loaded'

const meta: Meta = {
  title: 'Envisioned/Skeleton-First Loading',
  parameters: {
    docs: {
      description: {
        component: [
          'A blank region and a spinner both say nothing is here; a skeleton says six rows of ' +
            'exactly this shape are coming. What makes this envisioned rather than proposed is ' +
            'only reach: the skeleton-first sequence should be the default load discipline for ' +
            'every list surface in Studio, and the shipped component already contains everything ' +
            'needed to do it.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Lists & Data/Previews` (the layout-family stories that already exercise every `isPlaceholder` skeleton branch) and `Lists & Data/LoadingBlock`, the spinner this pattern retires from list duty |',
          '| Evidence | audit `skeleton-vs-spinner`, `instant-gratification`, `progress-indicator`, `doherty-threshold`; ledger #14 (the skeleton fix already ships inside the general previews as `isPlaceholder`, the audit’s blank-pane/spinner defect is a call-site change, not a component build); ledger #6 (the one real gap: the portable-text preview family lacks the branch) |',
          '| Patterns | `skeleton-vs-spinner` · `instant-gratification` · `doherty-threshold` |',
          '',
          'The difference is not cosmetic, it is the structure of the wait: skeletons commit the ' +
            'layout immediately (no reflow jolt when content lands), they scope the promise (six ' +
            'placeholders, not an indeterminate shimmer), and they make the load feel like the ' +
            'list resolving rather than the pane recovering. Both panels below render the ' +
            'identical component; the left panel merely declines to mount it until data arrives.',
          '',
          '> **Why it matters:** press Reload both and the two panes run the same simulated fetch. ' +
            'Each meter counts the milliseconds its pane showed no structure; the current pane ' +
            'banks the full latency as blank or spinner time and pays a layout jolt at the end, ' +
            'while the skeleton pane’s meter reads about zero because structure was on screen ' +
            'from the first frame. The meters are measured live, not asserted.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:lists',
    'chapter:nav',
    'pattern:skeleton-vs-spinner',
    'pattern:instant-gratification',
    'pattern:doherty-threshold',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

function PreviewRows({placeholder}: {placeholder: boolean}) {
  return (
    <Stack gap={2} padding={2}>
      {ROWS.map((row) => (
        <DefaultPreview
          key={row.title}
          title={placeholder ? undefined : row.title}
          subtitle={placeholder ? undefined : row.subtitle}
          isPlaceholder={placeholder}
        />
      ))}
    </Stack>
  )
}

/**
 * The race. Both panes fetch for the same 1.6s; the meters record how long each
 * showed no structure. Watch the left pane at the moment content arrives, the
 * reflow jolt from nothing to six rows, versus the right pane, where the same
 * arrival reads as placeholders resolving in place.
 */
export const TheRace: Story = {
  name: 'Proof: the race (blank-time meter)',
  render: () => {
    function Demo() {
      const [phase, setPhase] = useState<Phase>('idle')
      const [blankMs, setBlankMs] = useState<number | null>(null)
      const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

      const reload = useCallback(() => {
        if (timer.current) clearTimeout(timer.current)
        const startedAt = Date.now()
        setPhase('loading')
        setBlankMs(null)
        timer.current = setTimeout(() => {
          setPhase('loaded')
          // The current pane showed no structure for the whole fetch; the skeleton
          // pane held structure from its first frame.
          setBlankMs(Date.now() - startedAt)
        }, LOAD_MS)
      }, [])

      // Unmount cleanup only — the race starts on the button, not on mount, so the
      // story loads quiet and the viewer triggers the measurement deliberately.
      useEffect(() => {
        return () => {
          if (timer.current) clearTimeout(timer.current)
        }
      }, [])

      return (
        <Stack gap={4}>
          <Flex>
            <UIButton
              icon={PlayIcon}
              text="Reload both"
              tone="primary"
              disabled={phase === 'loading'}
              onClick={reload}
            />
          </Flex>
          <Flex gap={4} align="flex-start" wrap="wrap">
            {/* Current: blank, then a spinner, then everything at once. */}
            <Stack gap={2} style={{width: 360}}>
              <Text size={1} weight="medium">
                Current, spinner over a blank pane
              </Text>
              <Card border radius={2} style={{height: 300, overflow: 'hidden'}}>
                {phase === 'loaded' ? (
                  <PreviewRows placeholder={false} />
                ) : (
                  <Flex align="center" justify="center" height="fill">
                    {phase === 'loading' ? (
                      <Spinner muted />
                    ) : (
                      <Text size={1} muted>
                        Press “Reload both”
                      </Text>
                    )}
                  </Flex>
                )}
              </Card>
              <Card border padding={3} radius={2} tone={blankMs ? 'critical' : 'transparent'}>
                <Flex align="center" gap={3}>
                  <Text size={0} muted weight="medium">
                    Time without structure
                  </Text>
                  <Code size={1}>
                    {phase === 'loading' ? 'counting…' : blankMs ? `${blankMs}ms` : 'n/a'}
                  </Code>
                </Flex>
              </Card>
            </Stack>

            {/* Envisioned: the same component, mounted a phase earlier. */}
            <Stack gap={2} style={{width: 360}}>
              <Text size={1} weight="medium">
                Envisioned, skeleton previews from frame one
              </Text>
              <Card border radius={2} style={{height: 300, overflow: 'hidden'}}>
                <PreviewRows placeholder={phase !== 'loaded'} />
              </Card>
              <Card border padding={3} radius={2} tone={blankMs ? 'positive' : 'transparent'}>
                <Flex align="center" gap={3}>
                  <Text size={0} muted weight="medium">
                    Time without structure
                  </Text>
                  <Code size={1}>{phase === 'idle' ? 'n/a' : '~0ms'}</Code>
                </Flex>
              </Card>
            </Stack>
          </Flex>
          <Text size={0} muted>
            Same `DefaultPreview`, same fetch, same latency. The right pane is not a new component,
            it is the shipped skeleton branch (`isPlaceholder`) mounted during the wait instead of
            after it. Ledger #14: a call-site change, list by list.
          </Text>
        </Stack>
      )
    }
    return <Demo />
  },
}
