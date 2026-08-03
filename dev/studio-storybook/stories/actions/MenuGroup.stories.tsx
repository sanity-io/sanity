import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CopyIcon} from '@sanity/icons/Copy'
import {DocumentIcon} from '@sanity/icons/Document'
import {EditIcon} from '@sanity/icons/Edit'
import {EllipsisVerticalIcon} from '@sanity/icons/EllipsisVertical'
import {PublishIcon} from '@sanity/icons/Publish'
import {TranslateIcon} from '@sanity/icons/Translate'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Box, Card, Flex, Menu, MenuDivider, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Studio shadows from the barrel. MenuGroup is a nested-submenu trigger: it lives
// inside a Menu and opens its children in a flyout. Wrapped in a MenuButton here so
// the group is actually openable.
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {
  MenuGroup,
  type MenuGroupProps,
} from '../../../../packages/sanity/src/ui-components/menuGroup/MenuGroup'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'

// A MenuGroup submenu MUST be told to fly out sideways. @sanity/ui's MenuGroup sets no
// default placement, so it inherits Popover's `placement="bottom"` and opens the flyout
// directly BELOW its own trigger, occluding the items beneath it. Real Studio call sites
// (`FieldActionMenuGroup`, `UploadDropDownMenu`) all pass a right-first placement with a
// flip-to-the-other-side fallback (`left-start`), never a stack-below fallback.
const SUBMENU_POPOVER: MenuGroupProps['popover'] = {
  placement: 'right-start',
  fallbackPlacements: ['left-start', 'bottom', 'top'],
}

const meta: Meta<typeof MenuGroup> = {
  title: 'Actions & Commands/MenuGroup',
  component: MenuGroup,
  args: {text: 'Export'},
  argTypes: {
    text: {control: 'text'},
    tone: {control: 'radio', options: ['default', 'primary', 'positive', 'caution', 'critical']},
  },
  parameters: {
    docs: {
      description: {
        component: [
          'Menus grow. Every feature that ships adds a row, nobody ever removes one, and ' +
            'eventually the document menu is a column of fifteen things an editor reads past to ' +
            'reach the two they came for.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/ui-components/menuGroup/MenuGroup.tsx`, the Studio shadow of `@sanity/ui` MenuGroup |',
          '| Tier | CHROME. A nested-submenu trigger, commodity behaviour. The shadow only pins `fontSize` / `padding` for layout consistency and adds an optional tooltip |',
          '| Audit | ⚪ not-audited as a unit. It is the grouping primitive that *resolves* the `hicks-law` / `choice-overload` finding on flat menus; see `MenuButton › RecommendedGroupedMenu` |',
          '| Required config | `popover={{placement: "right-start", fallbackPlacements: ["left-start", "bottom", "top"]}}`. There is no sensible default, and no default is supplied |',
          '| Patterns | `smart-menu-items` · `hicks-law` |',
          '',
          'Menus grow. Every feature that ships adds a row, nobody ever removes one, and eventually ' +
            'the document menu is a column of fifteen things an editor reads past to reach the two ' +
            'they came for. `MenuGroup` is the way out. Drop one among your `MenuItem`s and its ' +
            'children live a level deeper, so the top of the menu stays short and scannable while ' +
            'Export, Advanced and Danger zone wait behind a hover.',
          '',
          'Open any menu below and hover a group to expand it. Groups nest, as the `Nested` story ' +
            'shows, but two levels is the practical limit: past that a person stops knowing where ' +
            'they are in the tree, and the chunking that was meant to reduce the search cost starts ' +
            'adding to it.',
          '',
          '> **Why it matters:** placement is not optional here. `@sanity/ui` `MenuGroup` ships *no* ' +
            'default flyout placement, so an unconfigured group inherits `Popover`’s ' +
            '`placement="bottom"` and opens its flyout directly below its own trigger, hiding the ' +
            'items underneath. Pass the right-first shape in the table above, with `left-start` ' +
            'leading the fallbacks so a starved edge flips sideways rather than stacking. Every ' +
            'story here does, and so does every Studio call site.',
          '',
          'The page closes *in context*: the "Anna Karenina" document-actions menu with its long tail ' +
            'chunked into Publishing, Translate and a critical Danger zone group.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'chapter:actions',
    'pattern:smart-menu-items',
    'pattern:hicks-law',
    'audit:not-audited',
    'source:studio-shadow',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof MenuGroup>

/**
 * Top-level actions plus two submenu groups. The first group's `text` and `tone` are wired
 * to the controls, so you can relabel and retone a bucket without leaving the page.
 */
export const Default: Story = {
  render: (props) => (
    <MenuButton
      id="group-default"
      button={<Button text="Document actions" iconRight={ChevronDownIcon} mode="ghost" />}
      menu={
        <Menu>
          <MenuItem text="Edit" icon={EditIcon} />
          <MenuItem text="Publish" icon={PublishIcon} />
          <MenuDivider />
          <MenuGroup
            text={props.text}
            tone={props.tone}
            icon={DocumentIcon}
            popover={SUBMENU_POPOVER}
          >
            <MenuItem text="Copy document ID" icon={CopyIcon} />
            <MenuItem text="Export as JSON" icon={DocumentIcon} />
          </MenuGroup>
          <MenuGroup text="Advanced" icon={EllipsisVerticalIcon} popover={SUBMENU_POPOVER}>
            <MenuItem text="Translate" icon={TranslateIcon} />
          </MenuGroup>
        </Menu>
      }
    />
  ),
}

/** A group inside a group. */
export const Nested: Story = {
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story: 'Groups nest: keep the tree shallow (two levels is usually the practical limit).',
      },
    },
  },
  render: () => (
    <MenuButton
      id="group-nested"
      button={<Button text="More" iconRight={ChevronDownIcon} mode="ghost" />}
      menu={
        <Menu>
          <MenuItem text="Edit" icon={EditIcon} />
          <MenuGroup text="Export" icon={DocumentIcon} popover={SUBMENU_POPOVER}>
            <MenuItem text="Copy document ID" icon={CopyIcon} />
            <MenuGroup text="As file" icon={DocumentIcon} popover={SUBMENU_POPOVER}>
              <MenuItem text="JSON" icon={DocumentIcon} />
              <MenuItem text="NDJSON" icon={DocumentIcon} />
            </MenuGroup>
          </MenuGroup>
        </Menu>
      }
    />
  ),
}

/** A group can carry a tone of its own, for instance a critical bucket. */
export const WithTone: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <MenuButton
      id="group-tone"
      button={<Button text="Document actions" iconRight={ChevronDownIcon} mode="ghost" />}
      menu={
        <Menu>
          <MenuItem text="Edit" icon={EditIcon} />
          <MenuDivider />
          <MenuGroup text="Danger zone" icon={TrashIcon} tone="critical" popover={SUBMENU_POPOVER}>
            <MenuItem text="Delete" icon={TrashIcon} tone="critical" />
          </MenuGroup>
        </Menu>
      }
    />
  ),
}

/**
 * In context: the document-actions menu for the "Anna Karenina" book, its long tail chunked
 * into labelled buckets. The everyday actions sit at the top; "Publishing", "Translate" and a
 * critical "Danger zone" wait behind a hover, each flying out to the side rather than stacking
 * below its trigger. This is MenuGroup taming a real document menu. Open the "…" and hover a
 * group to expand it.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card border radius={2} style={{maxWidth: 360}}>
      <Flex align="center" gap={1} padding={2}>
        <Box flex={1} style={{minWidth: 0}}>
          <Stack gap={2}>
            <Text size={1} weight="medium">
              Anna Karenina
            </Text>
            <Text size={0} muted>
              Book · Draft
            </Text>
          </Stack>
        </Box>
        <MenuButton
          id="group-book-row"
          button={
            <Button
              aria-label="Show document actions"
              icon={EllipsisVerticalIcon}
              mode="bleed"
              tooltipProps={{content: 'Actions'}}
            />
          }
          menu={
            <Menu>
              <MenuItem text="Edit" icon={EditIcon} />
              <MenuItem text="Duplicate" icon={CopyIcon} />
              <MenuDivider />
              <MenuGroup text="Publishing" icon={PublishIcon} popover={SUBMENU_POPOVER}>
                <MenuItem text="Publish" icon={PublishIcon} />
                <MenuItem text="Unpublish" icon={UnpublishIcon} />
              </MenuGroup>
              <MenuGroup text="Translate" icon={TranslateIcon} popover={SUBMENU_POPOVER}>
                <MenuItem text="Norwegian" />
                <MenuItem text="German" />
              </MenuGroup>
              <MenuDivider />
              <MenuGroup
                text="Danger zone"
                icon={TrashIcon}
                tone="critical"
                popover={SUBMENU_POPOVER}
              >
                <MenuItem text="Delete" icon={TrashIcon} tone="critical" />
              </MenuGroup>
            </Menu>
          }
        />
      </Flex>
    </Card>
  ),
}
