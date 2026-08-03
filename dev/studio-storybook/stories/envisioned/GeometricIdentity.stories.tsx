import {type User} from '@sanity/types'
import {Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useState} from 'react'
import {UserColorManagerContext} from 'sanity/_singletons'

// Real components from real paths (org contract §8): the identity atom under
// examination, and the colour manager it derives its hue from.
import {UserAvatar} from '../../../../packages/sanity/src/core/components/userAvatar/UserAvatar'
import {createUserColorManager} from '../../../../packages/sanity/src/core/user-color/manager'

const colorManager = createUserColorManager({scheme: 'dark'})
const WithUserColor: Decorator = (Story) => (
  <UserColorManagerContext.Provider value={colorManager}>
    <Story />
  </UserColorManagerContext.Provider>
)

/**
 * Two rosters that defeat initials+hue. The colliders share initials; in grayscale
 * they are the same avatar. Real orgs hit this fast: 26² initial pairs, hundreds of
 * collaborators.
 */
const COLLIDERS: User[] = [
  {id: 'anna-l', displayName: 'Anna Lindqvist', email: 'anna@example.com'},
  {id: 'aki-l', displayName: 'Aki Larsen', email: 'aki@example.com'},
  {id: 'amara-l', displayName: 'Amara Levy', email: 'amara@example.com'},
  {id: 'andre-l', displayName: 'André Laurent', email: 'andre@example.com'},
]

/** FNV-1a — tiny, stable, endianness-free: the same id derives the same identity forever. */
function hash(id: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * The envisioned second channel: a deterministic geometric sigil derived from the user
 * id — one of eight marks, each drawn to stay legible at 8px. Hue says "someone";
 * the sigil says "who" even when hue is gone (grayscale render, colour-blind viewer,
 * printed audit trail). Drawn inline as SVG paths so fill/contrast track the theme.
 */
const SIGILS: ((size: number) => ReactNode)[] = [
  (s) => <circle cx={s / 2} cy={s / 2} r={s * 0.32} />, // dot
  (s) => <rect x={s * 0.2} y={s * 0.2} width={s * 0.6} height={s * 0.6} />, // square
  (s) => (
    <path
      d={`M${s / 2} ${s * 0.14} L${s * 0.86} ${s / 2} L${s / 2} ${s * 0.86} L${s * 0.14} ${s / 2} Z`}
    />
  ), // diamond
  (s) => <path d={`M${s / 2} ${s * 0.16} L${s * 0.86} ${s * 0.84} L${s * 0.14} ${s * 0.84} Z`} />, // triangle
  (s) => <rect x={s * 0.16} y={s * 0.38} width={s * 0.68} height={s * 0.24} />, // bar
  (s) => (
    // ring
    <circle
      cx={s / 2}
      cy={s / 2}
      r={s * 0.3}
      fill="none"
      strokeWidth={s * 0.14}
      stroke="currentColor"
    />
  ),
  (s) => (
    // cross
    <path
      d={`M${s * 0.38} ${s * 0.16} h${s * 0.24} v${s * 0.22} h${s * 0.22} v${s * 0.24} h-${s * 0.22} v${s * 0.22} h-${s * 0.24} v-${s * 0.22} h-${s * 0.22} v-${s * 0.24} h${s * 0.22} Z`}
    />
  ),
  (s) => (
    // chevron
    <path
      d={`M${s * 0.16} ${s * 0.36} L${s / 2} ${s * 0.16} L${s * 0.84} ${s * 0.36} L${s * 0.84} ${s * 0.6} L${s / 2} ${s * 0.4} L${s * 0.16} ${s * 0.6} Z`}
    />
  ),
]

const SIGIL_NAMES = ['dot', 'square', 'diamond', 'triangle', 'bar', 'ring', 'cross', 'chevron']

function sigilIndex(id: string): number {
  return hash(id) % SIGILS.length
}

function Sigil({id, size = 12}: {id: string; size?: number}) {
  const index = sigilIndex(id)
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="currentColor"
      aria-hidden="true"
    >
      {SIGILS[index](size)}
    </svg>
  )
}

/**
 * The composed envisioned avatar: the REAL `UserAvatar` (initials + deterministic hue,
 * untouched) with the sigil docked at the corner the presence dot does not use, in a
 * theme-bg well so it holds on any hue.
 */
function SigilAvatar({user, size = 2}: {user: User; size?: 0 | 1 | 2 | 3}) {
  return (
    <div style={{position: 'relative', display: 'inline-flex'}}>
      <UserAvatar user={user} size={size} />
      <Flex
        align="center"
        justify="center"
        style={{
          position: 'absolute',
          right: -3,
          bottom: -3,
          width: 15,
          height: 15,
          borderRadius: 4,
          background: 'var(--card-bg-color)',
          border: '1px solid var(--card-border-color)',
          color: 'var(--card-fg-color)',
        }}
      >
        <Sigil id={user.id} size={9} />
      </Flex>
    </div>
  )
}

function Labelled({label, children}: {label: string; children: ReactNode}) {
  return (
    <Stack gap={2} style={{textAlign: 'center'}}>
      <Flex justify="center">{children}</Flex>
      <Text size={0} muted>
        {label}
      </Text>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Envisioned/Geometric Identity',
  decorators: [WithUserColor],
  parameters: {
    docs: {
      description: {
        component: [
          'Initials plus hue is a two-channel identity, and both channels are weak: initials ' +
            'collide, and hue is the one channel that does not survive grayscale, colour-blindness, ' +
            'or print.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Lists & Data/UserAvatar`, the Colors and Initials stories (identity = initials + deterministic per-user hue) and its Current pair, which already proved the presence dot collapses in grayscale |',
          '| Evidence | audit `similarity` (ch13: status/identity carried by colour-only signals of identical shape) and `collaborative-presence`; researcher’s brief §3, presence surfaces are only as trustworthy as the identity atom under them |',
          '| Patterns | `similarity` · `collaborative-presence` |',
          '',
          'Anna Lindqvist, Aki Larsen, Amara Levy and André Laurent are all "AL," and real orgs ' +
            'hit collisions like that fast. The identity atom deserves a third channel: a ' +
            'deterministic geometric sigil, one of eight marks derived from the user id the same ' +
            'way the hue already is, docked on the avatar corner the presence dot does not use. ' +
            'Same-initials users become dot-AL, square-AL, ring-AL, chevron-AL: distinguishable at ' +
            'a glance, nameable out loud, and stable forever because the derivation is a hash, not ' +
            'an assignment.',
          '',
          'The real `UserAvatar` renders untouched underneath, this is an additive channel, not a ' +
            "replacement, exactly like the anchor's dot-plus-label recommendation. The derivation " +
            'playground lets you type any id and watch the identity derive live, determinism you ' +
            'can falsify by typing the same id twice.',
          '',
          '> **Why it matters:** strip hue from the collider roster and current renders four ' +
            'identical avatars; the sigil row stays four distinct people. Cover the labels and try ' +
            'to tell four people all initialed AL apart, colour and grayscale, current and ' +
            'sigiled.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:cms',
    'chapter:lawsofux',
    'pattern:similarity',
    'pattern:collaborative-presence',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * The collider roster, current vs sigiled, colour and grayscale. Cover the labels and
 * try to tell the four "AL"s apart in each row, the bottom-left cell (current,
 * grayscale) is the audit finding; the bottom-right cell is the claim.
 */
export const GrayscaleTwins: Story = {
  name: 'Proof: grayscale twins (four people named AL)',
  render: () => {
    const Row = ({sigil, grayscale}: {sigil?: boolean; grayscale?: boolean}) => (
      <Card
        padding={3}
        radius={2}
        shadow={1}
        style={grayscale ? {filter: 'grayscale(1)'} : undefined}
      >
        <Flex gap={4} wrap="wrap">
          {COLLIDERS.map((user) =>
            sigil ? (
              <Labelled key={user.id} label={user.displayName ?? user.id}>
                <SigilAvatar user={user} />
              </Labelled>
            ) : (
              <Labelled key={user.id} label={user.displayName ?? user.id}>
                <UserAvatar user={user} size={2} />
              </Labelled>
            ),
          )}
        </Flex>
      </Card>
    )
    return (
      <Stack gap={4}>
        <Flex gap={4} wrap="wrap">
          <Stack gap={2} flex={1} style={{minWidth: 340}}>
            <Text size={1} weight="medium">
              Current, initials + hue
            </Text>
            <Row />
          </Stack>
          <Stack gap={2} flex={1} style={{minWidth: 340}}>
            <Text size={1} weight="medium">
              Envisioned, initials + hue + sigil
            </Text>
            <Row sigil />
          </Stack>
        </Flex>
        <Flex gap={4} wrap="wrap">
          <Stack gap={2} flex={1} style={{minWidth: 340}}>
            <Text size={1} weight="medium" muted>
              The same row in grayscale, one person, four times?
            </Text>
            <Row grayscale />
          </Stack>
          <Stack gap={2} flex={1} style={{minWidth: 340}}>
            <Text size={1} weight="medium" muted>
              Grayscale with sigils, still four people
            </Text>
            <Row sigil grayscale />
          </Stack>
        </Flex>
      </Stack>
    )
  },
}

/**
 * Type any user id (or name) and the identity derives live: hue from the real
 * `UserColorManager`, sigil from an FNV-1a hash of the same id. Type the same id
 * twice, you get the same identity twice. That determinism is the property that
 * makes the mark *identity* rather than decoration: no assignment step, no registry,
 * no drift between surfaces.
 */
export const DerivationPlayground: Story = {
  name: 'Derivation playground',
  render: () => {
    function Demo() {
      const [raw, setRaw] = useState('frank.herbert')
      const id = raw.trim() || 'anonymous'
      const displayName = id
        .split(/[.\-_\s]+/)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(' ')
      const user: User = {id, displayName, email: `${id}@example.com`}
      return (
        <Stack gap={4} style={{maxWidth: 420}}>
          <TextInput
            aria-label="User id"
            value={raw}
            onChange={(event) => setRaw(event.currentTarget.value)}
            placeholder="Type a user id…"
          />
          <Card padding={4} radius={2} shadow={1}>
            <Flex align="center" gap={4}>
              <SigilAvatar user={user} size={3} />
              <Stack gap={2}>
                <Text size={1} weight="medium">
                  {displayName}
                </Text>
                <Text size={0} muted>
                  sigil: {SIGIL_NAMES[sigilIndex(id)]} · derived from "{id}", retype it and the
                  identity repeats
                </Text>
              </Stack>
            </Flex>
          </Card>
        </Stack>
      )
    }
    return <Demo />
  },
}

/** All eight sigils at avatar-badge size (9px) and enlarged, the legibility floor check. */
export const SigilAlphabet: Story = {
  name: 'The sigil alphabet (8 marks, floor-size)',
  render: () => (
    <Card padding={4} radius={2} shadow={1}>
      <Flex gap={4} wrap="wrap">
        {SIGIL_NAMES.map((name, index) => (
          <Labelled key={name} label={name}>
            <Stack gap={3} style={{alignItems: 'center'}}>
              <Text size={3}>
                <svg
                  width={28}
                  height={28}
                  viewBox="0 0 28 28"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  {SIGILS[index](28)}
                </svg>
              </Text>
              <Text size={1}>
                <svg width={9} height={9} viewBox="0 0 9 9" fill="currentColor" aria-hidden="true">
                  {SIGILS[index](9)}
                </svg>
              </Text>
            </Stack>
          </Labelled>
        ))}
      </Flex>
    </Card>
  ),
}
