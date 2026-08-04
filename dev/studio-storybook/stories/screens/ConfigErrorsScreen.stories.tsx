import {Card, Code, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ConfigErrorsScreen} from '../../../../packages/sanity/src/core/studio/screens/ConfigErrorsScreen'
import {ScreenFrame} from '../../lib/screenFrame'

const meta: Meta<typeof ConfigErrorsScreen> = {
  title: 'Navbar & Shell/Screens/Config Errors (unimplemented)',
  component: ConfigErrorsScreen,
  parameters: {
    // The component takes no props.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'A catalog that quietly skips a screen like this one is less useful than one that ' +
            'shows it.',
          '',
          '|        |                                                                  |',
          '| ------ | ---------------------------------------------------------------- |',
          '| Source | `packages/sanity/src/core/studio/screens/ConfigErrorsScreen.tsx` |',
          '| Tier   | CHROME (nominally)                                               |',
          '| Status | dead code, filed in the upstream findings ledger                 |',
          '',
          'The component exists, is exported, and renders the string "TODO: implement config ' +
            'errors screen". The file is nine lines of live code and thirty of commented-out ' +
            'implementation, with a note at the top: the screen is not currently used anywhere, ' +
            'and is being kept as a basis for future work.',
          '',
          '> **Why it is storied at all:** the alternative readings of a file like this are all ' +
            'wrong in different ways. Somebody grepping for "config error" finds a component and ' +
            'assumes it works; somebody auditing coverage counts it as a screen and reports 12 ' +
            'where there are 11; somebody wiring up config validation imports it and ships a TODO ' +
            'to production. One story removes all three readings at once. Storying dead code is ' +
            'not padding the catalog, it is the catalog doing its job.',
          '',
          'The commented-out version is in the source: a heading, an explanation, a list of ' +
            '`ErrorMessage` rows, and a Retry button that reloads the page. It is a reasonable ' +
            'design. Nothing routes to it. Either finish it or delete it: the middle state is the ' +
            'only one that misleads.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:shell', 'audit:needs-work', 'source:studio-only', 'tier:chrome'],
}

export default meta
type Story = StoryObj<typeof ConfigErrorsScreen>

export const AsShipped: Story = {
  name: 'As shipped',
  parameters: {
    docs: {
      description: {
        story:
          'Not a broken story. This is the component\'s entire output: a bare text node reading "TODO: implement config errors screen", with no card, no layout and no styling, because the JSX that would have provided them is commented out beneath it.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <ScreenFrame height={140}>
        <Card height="fill" padding={4}>
          <ConfigErrorsScreen />
        </Card>
      </ScreenFrame>
      <Card border radius={2} padding={3} tone="caution">
        <Stack gap={3}>
          <Text size={1} weight="medium">
            That is the whole component
          </Text>
          <Code size={1}>{`export function ConfigErrorsScreen() {
  /* This screen is not currently being used anywhere.
     We're keeping it as a basis for future work */
  return <>TODO: implement config errors screen</>
  // ...30 lines of commented-out implementation
}`}</Code>
        </Stack>
      </Card>
    </Stack>
  ),
}
