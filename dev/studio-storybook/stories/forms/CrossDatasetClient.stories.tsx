import {Badge, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useEffect, useState} from 'react'

import {createCrossDatasetMockClient} from '../../lib/crossDatasetClient'

const PROJECT = 'mock-project-id'
const HOME = 'mock-data-set'
const OTHER = 'playground'

/** Deliberately disjoint. A client that resolved the wrong lake would show the wrong titles. */
const homeDocs = [{_id: 'article-launch', _type: 'article', title: 'The launch announcement'}]
const otherDocs = [
  {_id: 'guide-groq', _type: 'guide', title: 'Learning GROQ'},
  {_id: 'guide-pt', _type: 'guide', title: 'Portable Text in practice'},
  {_id: 'guide-schemas', _type: 'guide', title: 'Designing schemas'},
]

const client = createCrossDatasetMockClient({
  projectId: PROJECT,
  dataset: HOME,
  datasets: [
    {dataset: HOME, documents: homeDocs},
    {dataset: OTHER, documents: otherDocs},
  ],
})

interface Probe {
  label: string
  config: {projectId?: string; dataset?: string}
  titles: string[]
  reported: string
}

/**
 * Runs the real derivation the studio performs, against the real client, and prints what came
 * back. No assertion in prose: the story shows the values.
 */
function Probes() {
  const [rows, setRows] = useState<Probe[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const cases: {label: string; make: () => unknown}[] = [
        {label: 'the client as mounted', make: () => client},
        {
          label: `.withConfig({dataset: '${OTHER}'})`,
          make: () =>
            (client as never as {withConfig: (c: unknown) => unknown}).withConfig({
              dataset: OTHER,
            }),
        },
        {
          // The exact chain StudioCrossDatasetReferenceInput performs.
          label: `.withConfig({dataset: '${OTHER}'}).clone()`,
          make: () => {
            const w = (
              client as never as {withConfig: (c: unknown) => {clone: () => unknown}}
            ).withConfig({dataset: OTHER})
            return w.clone()
          },
        },
        {
          label: `.withConfig({dataset: '${OTHER}'}).withConfig({dataset: '${HOME}'})`,
          make: () => {
            const w = (
              client as never as {withConfig: (c: unknown) => {withConfig: (c: unknown) => unknown}}
            ).withConfig({dataset: OTHER})
            return w.withConfig({dataset: HOME})
          },
        },
        {
          label: `.withConfig({dataset: 'nonexistent'})`,
          make: () =>
            (client as never as {withConfig: (c: unknown) => unknown}).withConfig({
              dataset: 'nonexistent',
            }),
        },
      ]

      const out: Probe[] = []
      for (const c of cases) {
        const cl = c.make() as {
          config: () => {projectId: string; dataset: string}
          fetch: (q: string) => Promise<unknown>
        }
        const cfg = cl.config()
        const res = (await cl.fetch('*[defined(title)].title')) as string[] | null
        out.push({
          label: c.label,
          config: cfg,
          titles: Array.isArray(res) ? res : [],
          reported: `${cfg.projectId} / ${cfg.dataset}`,
        })
      }
      if (!cancelled) setRows(out)
    }
    // The probe is fire-and-forget by design: it sets state when it lands and the cleanup flag
    // stops a late resolve from writing after unmount. Nothing awaits it.
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  if (!rows) {
    return (
      <Text size={1} muted>
        querying…
      </Text>
    )
  }

  return (
    <Stack gap={3} style={{maxWidth: 680}}>
      {rows.map((r) => (
        <Card key={r.label} border radius={2} padding={3} tone="transparent">
          <Stack gap={3}>
            <Code size={0}>{r.label}</Code>
            <Flex align="center" gap={2} wrap="wrap">
              <Text size={0} muted>
                config() reports
              </Text>
              <Badge tone="primary" fontSize={0}>
                {r.reported}
              </Badge>
            </Flex>
            <Flex align="center" gap={2} wrap="wrap">
              <Text size={0} muted>
                fetch returned
              </Text>
              {r.titles.length === 0 ? (
                <Badge tone="caution" fontSize={0}>
                  nothing
                </Badge>
              ) : (
                r.titles.map((t) => (
                  <Badge key={t} tone="positive" fontSize={0}>
                    {t}
                  </Badge>
                ))
              )}
            </Flex>
          </Stack>
        </Card>
      ))}
    </Stack>
  )
}

const meta: Meta = {
  title: 'Foundations/Harness/Cross-Dataset Client',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          "Two of this storybook's other mock clients model a client as a single object with a " +
            'fixed identity, a correct simplification for a single-dataset story. It is silently ' +
            'wrong the moment a client crosses a dataset boundary, which is exactly what a ' +
            'cross-dataset reference does in production.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `lib/crossDatasetClient.ts`, exercised by a harness page, not a component page |',
          '| Tier | SERVICE. Prints what the client actually returns, because the thing it fixes is invisible in any story that merely uses it |',
          '',
          "**The problem it solves.** Both of the storybook's other mock clients model a client as a single thing with a fixed identity. Their `withConfig()` returns the same object:",
          '',
          '```ts',
          'withConfig: () => mockClient        // upstream test mock',
          'client.withConfig = () => client    // lib/mockContentLake.ts',
          '```',
          '',
          '`StudioCrossDatasetReferenceInput` does exactly this:',
          '',
          '```ts',
          'const crossDatasetClient = client.withConfig({dataset: schemaType.dataset, …}).clone()',
          '```',
          '',
          'and everything downstream reads `config()` off the result. Against the old mocks that chain fails twice: `.clone()` does not exist at all, and even if it did, `config()` would keep reporting the original dataset. The failure mode is the dangerous kind, not a crash, but a reference resolving against the wrong dataset while appearing to work.',
          '',
          '**Why this page prints values rather than asserting them in prose.** A docblock claiming "the derived client reports the other dataset" is exactly the sort of unverifiable wiring claim that ledger #61 was about. The story runs the real chain and shows the result, so the claim is checkable by looking.',
          '',
          "**What is still not storied, and why.** The `crossDatasetReference` input remains uncovered. The client is no longer the blocker; the preview layer is. A cross-dataset reference renders its target through `to[].preview` for a type that is not in this studio's schema by definition, and the mock preview store resolves previews against the local schema. Recorded as ledger #57, whose diagnosis has now been wrong twice and is stated as a boundary rather than a cause.",
          '',
          "> **Why it matters:** a dataset with no fixture gets an empty lake rather than the nearest one. Falling back to another dataset's documents would let a misconfigured story pass while asserting something untrue, which is the specific failure this whole file exists to prevent.",
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:foundations', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

export const Probes_: Story = {
  name: 'What each derived client reports and returns',
  parameters: {
    docs: {
      description: {
        story:
          'Five derivations of one client, each printing its own `config()` and the titles its `fetch` returned. The two datasets carry **disjoint** documents on purpose, so a client resolving the wrong lake shows the wrong titles rather than passing quietly.\n\nRows one and two are the basic claim: `withConfig` produces a genuinely different client. Row three is the exact chain the studio runs, `.withConfig(…).clone()`, and it is the one the old mocks could not survive. Row four re-derives back to the home dataset, which checks that the config merge is not one-way. Row five is the empty-lake guard.',
      },
    },
  },
  render: () => <Probes />,
}
