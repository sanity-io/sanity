import {TranslateIcon} from '@sanity/icons/Translate'
import {UsersIcon} from '@sanity/icons/Users'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'
import {Flex} from 'ui5'

import {ConditionMenu, ConditionMenuButton, type ConditionMenuOption} from '../ConditionMenuButton'

const KEY_OPTIONS: ConditionMenuOption[] = [
  {
    value: 'audience',
    title: 'Audience',
    description: 'Who this content is for.',
    icon: UsersIcon,
  },
  {
    value: 'locale',
    title: 'Locale',
    description: 'The visitor language and region.',
    icon: TranslateIcon,
  },
]

const VALUE_OPTIONS: ConditionMenuOption[] = [
  {value: 'loyal', title: 'Loyal customers', description: 'Repeat purchasers and members.'},
  {value: 'new', title: 'New visitors', description: 'First-time visitors to the site.'},
  {value: 'en-US', title: 'en-US'},
]

const noop = () => undefined

/**
 * The condition picker in the variant dialog: a select-like trigger per key/value, opening a
 * menu styled like the workspace switcher (icon, title, description; the current choice pressed
 * and checked). The trigger stays one line in every state so choosing never shifts the form.
 */
const meta = {
  title: 'Variants/Condition Menu Button',
  component: ConditionMenuButton,
} satisfies Meta<typeof ConditionMenuButton>

export default meta
type Story = StoryObj<typeof meta>

function Labelled({caption, children}: {caption: string; children: ReactNode}) {
  return (
    <Stack gap={2}>
      <Text muted size={0} weight="medium">
        {caption}
      </Text>
      {children}
    </Stack>
  )
}

/** Closed triggers: every state keeps the same single-line height. */
export const Trigger: Story = {
  args: {
    onSelect: noop,
    options: KEY_OPTIONS,
    placeholder: 'Choose a condition',
    testId: 'story-condition',
  },
  render: () => (
    <Card padding={4}>
      <Stack gap={4} style={{maxWidth: 360}}>
        <Labelled caption="empty">
          <ConditionMenuButton
            onSelect={noop}
            options={KEY_OPTIONS}
            placeholder="Choose a condition"
            testId="story-empty"
          />
        </Labelled>
        <Labelled caption="selected key">
          <ConditionMenuButton
            onSelect={noop}
            options={KEY_OPTIONS}
            placeholder="Choose a condition"
            selected={KEY_OPTIONS[0]}
            testId="story-selected-key"
          />
        </Labelled>
        <Labelled caption="selected value">
          <ConditionMenuButton
            onSelect={noop}
            options={VALUE_OPTIONS}
            placeholder="Choose a value"
            selected={VALUE_OPTIONS[0]}
            testId="story-selected-value"
          />
        </Labelled>
        <Labelled caption="invalid (stored key no longer configured)">
          <ConditionMenuButton
            invalid
            onSelect={noop}
            options={KEY_OPTIONS}
            placeholder="Choose a condition"
            selected={{value: 'legacy', title: 'legacy'}}
            testId="story-invalid"
          />
        </Labelled>
        <Labelled caption="disabled (no key picked yet)">
          <ConditionMenuButton
            disabled
            onSelect={noop}
            options={[]}
            placeholder="Choose a value"
            testId="story-disabled"
          />
        </Labelled>
        <Labelled caption="loading">
          <ConditionMenuButton
            loading
            onSelect={noop}
            options={[]}
            placeholder="Loading conditions"
            testId="story-loading"
          />
        </Labelled>
      </Stack>
    </Card>
  ),
}

/** The open list, rendered inline: keys carry an icon, values do not; the pick is checked. */
export const OpenMenu: Story = {
  args: {
    onSelect: noop,
    options: KEY_OPTIONS,
    placeholder: 'Choose a condition',
    testId: 'story-condition',
  },
  render: () => (
    <Card padding={4}>
      <Flex gap={4}>
        <Labelled caption="keys">
          <Card padding={1} radius={2} shadow={2} style={{width: 280}}>
            <ConditionMenu
              onSelect={noop}
              options={KEY_OPTIONS}
              selected={KEY_OPTIONS[0]}
              testId="story-keys"
            />
          </Card>
        </Labelled>
        <Labelled caption="values">
          <Card padding={1} radius={2} shadow={2} style={{width: 280}}>
            <ConditionMenu
              onSelect={noop}
              options={VALUE_OPTIONS}
              selected={VALUE_OPTIONS[1]}
              testId="story-values"
            />
          </Card>
        </Labelled>
      </Flex>
    </Card>
  ),
}
