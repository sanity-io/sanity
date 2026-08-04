import {ArchiveIcon} from '@sanity/icons/Archive'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {PublishIcon} from '@sanity/icons/Publish'
import {Card, Code, Flex, LayerProvider, Menu, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Actions are NOT components. They are functions returning a description, and the studio renders
 * it. So a story cannot mount one - it can only call it and show what came back, which is exactly
 * what this page does: run the real action functions and render their descriptions the way the
 * document footer would.
 *
 * That is a deliberate limitation rather than a shortcut. Mounting a fake footer and claiming it
 * is the studio's would assert something no reader could check; running the function and showing
 * its return value asserts only what actually happened.
 */
interface ActionDescription {
  label: string
  icon?: unknown
  tone?: 'default' | 'primary' | 'positive' | 'caution' | 'critical'
  disabled?: boolean
  title?: string
  shortcut?: string | null
  onHandle?: () => void
}

/** A minimal built-in-looking action, standing in for one of Studio's own. */
function defaultPublishAction(): ActionDescription {
  return {
    label: 'Publish',
    icon: PublishIcon,
    tone: 'primary',
    shortcut: 'mod+alt+p',
    onHandle: () => undefined,
  }
}

/**
 * DECORATION, action-style. There is no `renderDefault` here - the equivalent move is to CALL the
 * action you are wrapping and spread its description, overriding the fields you care about.
 */
function wrappedPublishAction(): ActionDescription {
  const original = defaultPublishAction()
  return {
    ...original,
    label: 'Publish & notify team',
    tone: 'positive',
    icon: CheckmarkCircleIcon,
  }
}

/** A wholly new action, which is the common case - most people add rather than replace. */
function archiveAction(): ActionDescription {
  return {
    label: 'Archive',
    icon: ArchiveIcon,
    tone: 'caution',
    title: 'Move this document out of the active set',
    onHandle: () => undefined,
  }
}

/** An action that decides it is not applicable and returns null. */
function conditionalAction(applicable: boolean): ActionDescription | null {
  if (!applicable) return null
  return {label: 'Send to legal', icon: ArchiveIcon, tone: 'default'}
}

/**
 * Renders a description the way the document footer does: primary as a button, the rest as menu
 * items. Labelled as a stand-in so nobody reads it as the real footer.
 */
function DescriptionPreview({
  description,
  as = 'button',
}: {
  description: ActionDescription | null
  as?: 'button' | 'menuItem'
}) {
  if (!description) {
    return (
      <Card border radius={2} padding={3} style={{borderStyle: 'dashed'}}>
        <Text size={0} muted>
          the action returned null, so the studio renders nothing for it
        </Text>
      </Card>
    )
  }
  if (as === 'button') {
    return (
      <Button
        text={description.label}
        icon={description.icon as never}
        tone={description.tone}
        disabled={description.disabled}
      />
    )
  }
  // A real `MenuItem` needs a `Menu` ancestor (`useMenu()` throws without one), and `Menu` needs
  // a `LayerProvider`. Both are the containers the studio renders these rows inside.
  return (
    <LayerProvider>
      <Menu>
        <MenuItem
          text={description.label}
          icon={description.icon as never}
          tone={description.tone}
          disabled={description.disabled}
        />
      </Menu>
    </LayerProvider>
  )
}

function Row({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <Stack gap={3}>
      <Text size={0} muted>
        {label}
      </Text>
      <Flex gap={2} align="center">
        {children}
      </Flex>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Customisation/Document Actions',
  decorators: [WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'A document action is a function that returns a description; the studio decides how ' +
            'to render it and the author never draws the button. That is different from every ' +
            'other customisation in this chapter, which hands over `renderDefault` and asks for ' +
            'JSX back.',
          '',
          '|          |                                                                                  |',
          '| -------- | -------------------------------------------------------------------------------- |',
          '| Seam     | `document.actions`, typed `DocumentActionComponent[] \\| DocumentActionsResolver` |',
          '| Tier     | SERVICE                                                                          |',
          '| Patterns | `actions`                                                                        |',
          '',
          'This is the seam for changing what an editor can do to a document, the Publish ' +
            'button and the menu beside it. The same action has to render as a primary button, as ' +
            'a row in a menu, and as an entry in the command palette, and it should look native ' +
            'in all three without the author knowing which context it landed in. Handing back ' +
            'data rather than markup is what makes that possible.',
          '',
          'That means the instinct carried over from `form.components.input`, wrap ' +
            '`renderDefault`, has nothing to grab, and the equivalent move is to call the action ' +
            'you are extending and spread its description.',
          '',
          'Two more properties. An action returning `null` is removed entirely, which is how ' +
            'conditional actions work, no `hidden` flag, just absence. And because actions are ' +
            'functions of `DocumentActionProps` (which extends `EditStateFor`), they can read the ' +
            'document\'s draft/published state to decide. That is how "Publish" disables itself on ' +
            'an unchanged document.',
          '',
          'These stories call the real action shape and render what comes back. They do not ' +
            "mount a document footer, a fake footer claiming to be the studio's would assert " +
            'something you could not check. What is shown is the description, and the rendering ' +
            'beside it is labelled as a stand-in.',
          '',
          '> **Why it matters:** an action is a function that returns a description, not a ' +
            'component that returns markup. Reach for that description as the unit of extension, ' +
            'call and spread rather than wrap, and the studio keeps rendering it correctly in ' +
            'every context it can appear.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:customisation',
    'pattern:actions',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const TheShape: Story = {
  name: '1. The shape - a function returning data',
  parameters: {
    docs: {
      description: {
        story:
          'The whole contract, on one page. An action is a function; its return value is a plain object; the studio renders it. Compare with `form.components.input`, where you return JSX and the studio renders nothing on your behalf.',
      },
    },
  },
  render: () => (
    <Stack gap={4} style={{maxWidth: 560}}>
      <Card border radius={2} padding={3} tone="transparent">
        <Code size={1}>{`function publishAction(props: DocumentActionProps) {
  return {
    label: 'Publish',
    icon: PublishIcon,
    tone: 'primary',
    shortcut: 'mod+alt+p',
    onHandle: () => { /* … */ },
  }
}`}</Code>
      </Card>
      <Row label="rendered by the studio as a primary button">
        <DescriptionPreview description={defaultPublishAction()} />
      </Row>
      <Row label="and as a menu row, from the same description">
        <Card border radius={2} padding={1} style={{width: 260}}>
          <DescriptionPreview description={defaultPublishAction()} as="menuItem" />
        </Card>
      </Row>
      <Text size={0} muted>
        One description, two renderings, neither of them authored by the action.
      </Text>
    </Stack>
  ),
}

export const Wrapped: Story = {
  name: '2. Extending an existing action',
  parameters: {
    docs: {
      description: {
        story:
          "The action equivalent of decorating: call the action you are extending, spread its description, override what you need. Here Publish keeps its shortcut and its handler and gains a new label, tone and icon.\n\nThis is the move to reach for when you want Studio's behaviour with your own presentation - and note what it preserves for free. `onHandle` still points at the original publish logic, so the thing that made it correct is untouched.",
      },
    },
  },
  render: () => (
    <Stack gap={4} style={{maxWidth: 560}}>
      <Row label="the original">
        <DescriptionPreview description={defaultPublishAction()} />
      </Row>
      <Row label="spread and overridden">
        <DescriptionPreview description={wrappedPublishAction()} />
      </Row>
      <Card border radius={2} padding={3} tone="transparent">
        <Code size={1}>{`const original = publishAction(props)
return {...original, label: 'Publish & notify team', tone: 'positive'}`}</Code>
      </Card>
    </Stack>
  ),
}

export const Added: Story = {
  name: '3. Adding a new action',
  parameters: {
    docs: {
      description: {
        story:
          "The common case - most customisation here is addition rather than replacement. A wholly new action with its own label, tone, tooltip and handler.\n\n`title` becomes the tooltip; `tone` decides how loud it looks. Both are the studio's to render, which is why an added action looks native without the author matching any styles.",
      },
    },
  },
  render: () => (
    <Stack gap={4} style={{maxWidth: 560}}>
      <Row label="a new action, rendered by the studio">
        <DescriptionPreview description={archiveAction()} />
      </Row>
      <Row label="the same description as a menu row">
        <Card border radius={2} padding={1} style={{width: 260}}>
          <DescriptionPreview description={archiveAction()} as="menuItem" />
        </Card>
      </Row>
    </Stack>
  ),
}

export const ReturningNull: Story = {
  name: '4. Conditional actions - returning null',
  parameters: {
    docs: {
      description: {
        story:
          'There is no `hidden` flag. An action that should not appear **returns `null`**, and the studio renders nothing for it. Toggle the switch below.\n\nThat is a stronger contract than a hidden flag, because absence composes: an action list is filtered before rendering, so a null action does not leave a gap, does not affect ordering, and cannot be revealed by CSS. It also means "should this exist?" and "what should it look like?" are the same function call, evaluated against the same document state.',
      },
    },
  },
  render: function ConditionalStory() {
    const [applicable, setApplicable] = useState(true)
    return (
      <Stack gap={4} style={{maxWidth: 560}}>
        <Flex gap={2} align="center">
          <Button
            text={applicable ? 'Make it inapplicable' : 'Make it applicable'}
            mode="ghost"
            onClick={() => setApplicable((v) => !v)}
          />
          <Text size={0} muted>
            document state: {applicable ? 'needs legal review' : 'already reviewed'}
          </Text>
        </Flex>
        <Row label="what the action returns">
          <DescriptionPreview description={conditionalAction(applicable)} />
        </Row>
      </Stack>
    )
  },
}

export const Disabled: Story = {
  name: '5. Present but disabled',
  parameters: {
    docs: {
      description: {
        story:
          'The other option, and the choice between them is a real design decision the seam leaves to you. `disabled: true` keeps the action visible and inert; returning `null` removes it.\n\nThe same tension shows up across the catalog - `CreateReleaseMenuItem` disables with a tooltip, the comments inspector header removes its controls in upsell mode. The rule that reconciles them: **disable when the action exists but is currently unavailable; remove when it does not apply to this document at all.** A disabled control is a promise about the future; an absent one is a statement about the present.',
      },
    },
  },
  render: () => (
    <Stack gap={4} style={{maxWidth: 560}}>
      <Row label="disabled - exists, not available right now">
        <DescriptionPreview description={{...defaultPublishAction(), disabled: true}} />
      </Row>
      <Row label="null - does not apply to this document">
        <DescriptionPreview description={null} />
      </Row>
    </Stack>
  ),
}
