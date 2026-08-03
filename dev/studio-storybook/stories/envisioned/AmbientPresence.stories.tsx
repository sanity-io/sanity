import {type User} from '@sanity/types'
import {Badge, Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'
import {useEffect, useState} from 'react'
import {UserColorManagerContext} from 'sanity/_singletons'

// Real components from real paths (org contract §8): the identity atom every presence
// surface composes, and the colour manager it derives from.
import {UserAvatar} from '../../../../packages/sanity/src/core/components/userAvatar/UserAvatar'
import {createUserColorManager} from '../../../../packages/sanity/src/core/user-color/manager'

const colorManager = createUserColorManager({scheme: 'dark'})
const WithUserColor: Decorator = (Story) => (
  <UserColorManagerContext.Provider value={colorManager}>
    <Story />
  </UserColorManagerContext.Provider>
)

const GRACE: User = {id: 'grace', displayName: 'Grace Hopper', email: 'grace@example.com'}
const ADA: User = {id: 'ada', displayName: 'Ada Lovelace', email: 'ada@example.com'}

const FIELDS = ['Title', 'Slug', 'Body', 'SEO description'] as const
type FieldName = (typeof FIELDS)[number]

/**
 * The simulated colleagues: each follows a scripted patrol through the form, dwelling
 * on a field for a few ticks before moving on — enough motion that the ambient layer
 * visibly *updates itself*, which is the property under demonstration.
 */
const PATROLS: Record<string, (FieldName | null)[]> = {
  grace: ['Title', 'Title', 'Body', 'Body', 'Body', null, 'SEO description', 'SEO description'],
  ada: ['Slug', null, 'Slug', 'Title', 'Title', 'Title', null, 'Body'],
}

const COLLEAGUES: {user: User; key: keyof typeof PATROLS}[] = [
  {user: GRACE, key: 'grace'},
  {user: ADA, key: 'ada'},
]

const meta: Meta = {
  title: 'Envisioned/Ambient Presence',
  decorators: [WithUserColor],
  parameters: {
    docs: {
      description: {
        component: [
          'Presence that lives in a panel is presence you consult after deciding to worry, which ' +
            'is to say, after the collision. Ambient presence inverts the order: the form itself ' +
            'wears the humans.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Lists & Data/UserAvatar` (Presence roster, the overlapped-avatar stack this layer composes from) and `Collaboration/Comments`, the panel presence currently hides behind |',
          '| Evidence | audit `collaborative-presence` (ch14: show who else is here, where they’re working, what has activity, ambiently, before opening a panel; add-comment is hover-only and badges show totals, not presence); researcher’s brief §3, presence is one of the sixteen convergent failures; §4 names the reason Studio can win it: presence needs realtime, and Studio is the only product in the field whose foundation was built for the thing the whole field failed at |',
          '| Patterns | `collaborative-presence` |',
          '',
          'Each field row carries the real `UserAvatar` of whoever is working it right now, moving ' +
            'as they move; the document header carries the roster. And the payoff moment, the one ' +
            'the whole layer is priced against, is the collision warning: focus a field a ' +
            'colleague is mid-edit in, and the field says so before your first keystroke, naming ' +
            'the person, at the exact moment and place the information is worth something. No ' +
            'panel was opened; nobody asked in Slack.',
          '',
          '> **Why it matters:** the colleagues here are simulated on a timer precisely so you can ' +
            'watch the ambient layer keep itself true without any interaction from you. Click ' +
            'into whichever field Grace currently occupies and watch the warning arrive ' +
            'pre-keystroke; on the real realtime substrate this is the same wiring with the timer ' +
            'replaced by the presence stream Studio already ships.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:cms',
    'pattern:collaborative-presence',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/**
 * The form that wears its humans. Watch the avatars patrol on their own; then focus
 * the field one of them occupies, the collision notice names the colleague before
 * you have typed anything. Blur, or wait for them to move on, and it withdraws.
 */
export const LivePresence: Story = {
  name: 'The ambient layer (watch, then collide)',
  render: () => {
    function Demo() {
      const [tick, setTick] = useState(0)
      const [focused, setFocused] = useState<FieldName | null>(null)
      const [values, setValues] = useState<Record<FieldName, string>>({
        'Title': 'Dune',
        'Slug': 'dune',
        'Body': 'Arrakis, the desert planet…',
        'SEO description': '',
      })

      useEffect(() => {
        const interval = setInterval(() => setTick((t) => t + 1), 2500)
        return () => clearInterval(interval)
      }, [])

      const whereIs = (key: keyof typeof PATROLS): FieldName | null =>
        PATROLS[key][tick % PATROLS[key].length]

      const occupants = (field: FieldName) =>
        COLLEAGUES.filter((colleague) => whereIs(colleague.key) === field)

      const activeCount = COLLEAGUES.filter((colleague) => whereIs(colleague.key) !== null).length

      return (
        <Stack gap={3} style={{maxWidth: 480}}>
          {/* Document header: the roster, ambient. */}
          <Card border padding={3} radius={2} tone="transparent">
            <Flex align="center" gap={3}>
              <Box flex={1}>
                <Text size={1} weight="medium">
                  Dune, book
                </Text>
              </Box>
              <Flex>
                {COLLEAGUES.map((colleague, index) => (
                  <div key={colleague.user.id} style={{marginLeft: index === 0 ? 0 : -6}}>
                    <UserAvatar
                      user={colleague.user}
                      size={1}
                      status={whereIs(colleague.key) ? 'editing' : 'inactive'}
                    />
                  </div>
                ))}
              </Flex>
              <Text size={0} muted>
                {activeCount} editing now
              </Text>
            </Flex>
          </Card>

          {/* The fields, each wearing its occupants. */}
          <Card border padding={3} radius={2}>
            <Stack gap={4}>
              {FIELDS.map((field) => {
                const present = occupants(field)
                const collision = focused === field && present.length > 0
                return (
                  <Stack key={field} gap={2}>
                    <Flex align="center" gap={2}>
                      <Box flex={1}>
                        <Text size={1} weight="medium">
                          {field}
                        </Text>
                      </Box>
                      {present.map((colleague) => (
                        <Flex key={colleague.user.id} align="center" gap={2}>
                          <UserAvatar user={colleague.user} size={0} status="editing" />
                          <Text size={0} muted>
                            {(colleague.user.displayName ?? '').split(' ')[0]} is here
                          </Text>
                        </Flex>
                      ))}
                    </Flex>
                    <TextInput
                      aria-label={field}
                      value={values[field]}
                      onChange={(event) =>
                        setValues({...values, [field]: event.currentTarget.value})
                      }
                      onFocus={() => setFocused(field)}
                      onBlur={() => setFocused(null)}
                    />
                    {collision && (
                      <Card padding={3} radius={2} tone="caution" border>
                        <Flex align="center" gap={3}>
                          <UserAvatar user={present[0].user} size={0} status="editing" />
                          <Text size={1}>
                            {present[0].user.displayName} is editing this field right now, your
                            changes may collide with theirs.
                          </Text>
                        </Flex>
                      </Card>
                    )}
                  </Stack>
                )
              })}
            </Stack>
          </Card>

          <Flex align="center" gap={2}>
            <Badge fontSize={0}>simulated presence stream</Badge>
            <Text size={0} muted>
              colleagues move every ~2.5s; the layer keeps itself true with no interaction
            </Text>
          </Flex>
        </Stack>
      )
    }
    return <Demo />
  },
}
