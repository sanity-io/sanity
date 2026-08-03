import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CloseIcon} from '@sanity/icons/Close'
import {EditIcon} from '@sanity/icons/Edit'
import {RobotIcon} from '@sanity/icons/Robot'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {UserIcon} from '@sanity/icons/User'
import {
  Badge,
  Button as UIButton,
  Card,
  Code,
  Flex,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type CSSProperties, useMemo, useState} from 'react'

type Origin = 'human' | 'machine' | 'machine-revised'

interface Span {
  id: string
  text: string
  origin: Origin
  /** Present on machine and machine-revised spans — the durable ledger entry. */
  provenance?: {model: string; prompt: string; acceptedAt: string}
}

let spanCounter = 0
const nextId = () => `span-${++spanCounter}`

const HUMAN_OPENING: Span[] = [
  {
    id: nextId(),
    text: 'Arrakis is the sole known source of the spice melange. ',
    origin: 'human',
  },
]

const MACHINE_DRAFT =
  'Control of its harvest has therefore shaped imperial politics for generations, and every great house maintains a costly presence in the deep desert.'

const PROVENANCE = {
  model: 'claude-fable-5',
  prompt: 'Continue the paragraph about the strategic importance of Arrakis',
  acceptedAt: '2026-07-24 02:14',
}

const ORIGIN_LABEL: Record<Origin, string> = {
  'human': 'human-written',
  'machine': 'machine-written',
  'machine-revised': 'machine-origin, human-revised',
}

const meta: Meta = {
  title: 'Envisioned/Provenance Ledger',
  parameters: {
    docs: {
      description: {
        component: [
          'Three products stream AI output straight into the document with no gate; one has the ' +
            "field's only per-output accept-gate and then erases provenance at the moment of " +
            'accept; zero of seven observed products can answer which words are machine-written ' +
            'one minute after acceptance.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Forms & Input/PortableText`, the block editor these spans would live in, with the acceptance-gate mechanics inherited from the field’s one good example (per the benchmark, WordPress’s Discard/Regenerate/Accept gate) minus its fatal flaw |',
          '| Evidence | researcher’s brief Claim 1, provenance-preserving AI acceptance, ranked the largest unclaimed opening in the field. The brief’s design sentence is implemented literally here: accept should be an event in the document’s history, not a paste |',
          '| Patterns | `block-editor-authoring` · `content-versioning` |',
          '',
          'The model is three commitments. Accept is an event: the gate’s Accept commits spans ' +
            'that permanently carry model, prompt, and acceptedAt. Provenance survives editing: ' +
            'revising a machine span transitions it to a third, honest state, because the ' +
            'interesting enterprise question is not binary. The document can answer: at any time, ' +
            'a minute or a year after acceptance, which words did the machine write is a query ' +
            'the document itself resolves.',
          '',
          'That last property is the procurement question the brief says is already being ' +
            'learned, and it is cheap only on a substrate that models text as spans, the ' +
            'structural advantage Portable Text already has.',
          '',
          '> **Why it matters:** toggle the provenance lens and machine spans reveal a dotted ' +
            'underline; the ledger is invisible until asked, so the reading surface pays nothing. ' +
            'Run the full loop: generate, accept, toggle the lens, revise a span, ask again, the ' +
            'revised span still answers, as machine-origin, human-revised.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:cms',
    'chapter:beyond',
    'pattern:block-editor-authoring',
    'pattern:content-versioning',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/**
 * The full loop. 1: Generate, the draft arrives *gated*, not pasted. 2: Accept, the
 * text joins the paragraph as provenance-carrying spans. 3: Toggle the lens, the
 * ledger becomes visible without changing the text. 4: Click a machine span and
 * revise it, it transitions to machine-origin/human-revised rather than laundering
 * to human. 5: Press the one-minute test, the document answers the question.
 */
export const TheLedger: Story = {
  name: 'The ledger (accept is an event, not a paste)',
  render: () => {
    function Demo() {
      const [spans, setSpans] = useState<Span[]>(HUMAN_OPENING)
      const [proposal, setProposal] = useState<string | null>(null)
      const [lens, setLens] = useState(false)
      const [selectedId, setSelectedId] = useState<string | null>(null)
      const [revision, setRevision] = useState<string | null>(null)
      const [asked, setAsked] = useState(false)

      const selected = spans.find((span) => span.id === selectedId)
      const machineWords = useMemo(
        () =>
          spans
            .filter((span) => span.origin !== 'human')
            .reduce((total, span) => total + span.text.trim().split(/\s+/).length, 0),
        [spans],
      )

      const handleAccept = () => {
        if (!proposal) return
        setSpans((prev) => [
          ...prev,
          {id: nextId(), text: proposal, origin: 'machine', provenance: {...PROVENANCE}},
        ])
        setProposal(null)
      }

      const handleRevise = () => {
        if (!selected || revision === null) return
        setSpans((prev) =>
          prev.map((span) =>
            span.id === selected.id
              ? {...span, text: revision, origin: 'machine-revised' as Origin}
              : span,
          ),
        )
        setRevision(null)
        setSelectedId(null)
      }

      const spanStyle = (span: Span): CSSProperties => {
        const base: CSSProperties = {cursor: span.origin === 'human' ? 'default' : 'pointer'}
        if (asked && span.origin !== 'human') {
          base.background = 'var(--card-badge-caution-bg-color)'
          base.borderRadius = 2
        }
        if (lens && span.origin === 'machine') {
          base.borderBottom = '2px dotted var(--card-badge-primary-fg-color)'
        }
        if (lens && span.origin === 'machine-revised') {
          base.borderBottom = '2px dotted var(--card-badge-default-fg-color)'
          base.opacity = 0.85
        }
        if (span.id === selectedId) {
          base.outline = '1px solid var(--card-focus-ring-color)'
          base.borderRadius = 2
        }
        return base
      }

      return (
        <Stack gap={3} style={{maxWidth: 640}}>
          <Flex align="center" gap={3} justify="space-between">
            <Flex gap={2}>
              <UIButton
                icon={SparklesIcon}
                text="Generate continuation"
                mode="ghost"
                tone="primary"
                disabled={proposal !== null}
                onClick={() => setProposal(MACHINE_DRAFT)}
              />
              <UIButton
                icon={RobotIcon}
                text="Which words did the machine write?"
                mode="ghost"
                onClick={() => setAsked((prev) => !prev)}
              />
            </Flex>
            <Flex align="center" gap={2}>
              <Switch
                checked={lens}
                onChange={(event) => setLens(event.currentTarget.checked)}
                aria-label="Provenance lens"
              />
              <Text size={1} muted>
                lens
              </Text>
            </Flex>
          </Flex>

          {/* The document. Spans are the substrate — clicking a machine span opens its ledger entry. */}
          <Card border padding={4} radius={2}>
            <Text size={2} style={{lineHeight: 1.7}}>
              {spans.map((span) => {
                // Human spans are plain prose; machine-origin spans are inspectable —
                // keyboard-reachable buttons in span's clothing (a11y parity with click).
                if (span.origin === 'human') {
                  return (
                    <span key={span.id} style={spanStyle(span)}>
                      {span.text}
                    </span>
                  )
                }
                const toggleInspector = () =>
                  setSelectedId((prev) => (prev === span.id ? null : span.id))
                return (
                  // A real inline <button> (`all: 'unset'` keeps it typographically a span),
                  // so inspecting a span is keyboard-reachable for free.
                  <button
                    key={span.id}
                    type="button"
                    aria-label={`Inspect provenance: ${ORIGIN_LABEL[span.origin]}`}
                    style={{all: 'unset', ...spanStyle(span)}}
                    onClick={toggleInspector}
                  >
                    {span.text}
                  </button>
                )
              })}
            </Text>
          </Card>

          {asked && (
            <Card border padding={3} radius={2} tone="caution">
              <Text size={1}>
                {machineWords === 0
                  ? 'No machine-written words in this document.'
                  : `${machineWords} words are machine-origin, highlighted above, revisions included. Zero of the seven products the benchmark observed could produce this answer.`}
              </Text>
            </Card>
          )}

          {/* The gate: the WordPress-proven interaction, minus the provenance erasure. */}
          {proposal && (
            <Card border padding={3} radius={2} tone="primary">
              <Stack gap={3}>
                <Flex align="center" gap={2}>
                  <Text size={1}>
                    <SparklesIcon />
                  </Text>
                  <Text size={1} weight="medium">
                    Proposed continuation, nothing is in the document yet
                  </Text>
                </Flex>
                <Card padding={3} radius={2} tone="transparent" border>
                  <Text size={1} muted style={{lineHeight: 1.6}}>
                    {proposal}
                  </Text>
                </Card>
                <Flex gap={2}>
                  <UIButton
                    icon={CloseIcon}
                    text="Discard"
                    mode="bleed"
                    onClick={() => setProposal(null)}
                  />
                  <UIButton
                    icon={SparklesIcon}
                    text="Regenerate"
                    mode="ghost"
                    onClick={() => setProposal(MACHINE_DRAFT)}
                  />
                  <UIButton
                    icon={CheckmarkIcon}
                    text="Accept, as an event, with provenance"
                    tone="positive"
                    onClick={handleAccept}
                  />
                </Flex>
              </Stack>
            </Card>
          )}

          {/* The ledger entry: what a span knows about itself, on demand. */}
          {selected && selected.provenance && (
            <Card border padding={3} radius={2}>
              <Stack gap={3}>
                <Flex align="center" gap={2}>
                  <Text size={1}>
                    {selected.origin === 'machine' ? <RobotIcon /> : <EditIcon />}
                  </Text>
                  <Text size={1} weight="medium">
                    Ledger entry
                  </Text>
                  <Badge fontSize={0} tone={selected.origin === 'machine' ? 'primary' : 'default'}>
                    {ORIGIN_LABEL[selected.origin]}
                  </Badge>
                </Flex>
                <Code size={0}>
                  {`model:      ${selected.provenance.model}\nprompt:     “${selected.provenance.prompt}”\naccepted:   ${selected.provenance.acceptedAt}`}
                </Code>
                {revision === null ? (
                  <Flex>
                    <UIButton
                      icon={EditIcon}
                      text="Revise this span"
                      mode="ghost"
                      onClick={() => setRevision(selected.text)}
                    />
                  </Flex>
                ) : (
                  <Stack gap={2}>
                    <TextInput
                      aria-label="Revise span"
                      value={revision}
                      onChange={(event) => setRevision(event.currentTarget.value)}
                    />
                    <Flex gap={2}>
                      <UIButton text="Cancel" mode="bleed" onClick={() => setRevision(null)} />
                      <UIButton
                        text="Commit revision, provenance survives"
                        tone="primary"
                        onClick={handleRevise}
                      />
                    </Flex>
                  </Stack>
                )}
              </Stack>
            </Card>
          )}

          {/* Legend, doubling as the state readout. */}
          <Flex gap={3} wrap="wrap">
            <Flex align="center" gap={2}>
              <Text size={0} muted>
                <UserIcon />
              </Text>
              <Text size={0} muted>
                {spans.filter((span) => span.origin === 'human').length} human
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Text size={0} muted>
                <RobotIcon />
              </Text>
              <Text size={0} muted>
                {spans.filter((span) => span.origin === 'machine').length} machine
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Text size={0} muted>
                <EditIcon />
              </Text>
              <Text size={0} muted>
                {spans.filter((span) => span.origin === 'machine-revised').length} machine-revised
              </Text>
            </Flex>
          </Flex>
        </Stack>
      )
    }
    return <Demo />
  },
}
