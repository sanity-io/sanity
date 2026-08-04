import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CogIcon} from '@sanity/icons/Cog'
import {DocumentIcon} from '@sanity/icons/Document'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {ImageIcon} from '@sanity/icons/Image'
import {LinkIcon} from '@sanity/icons/Link'
import {RestoreIcon} from '@sanity/icons/Restore'
import {Box, Card, Flex, Menu, Tab as UITab, TabList, TabPanel, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

// See stories/studio/Button.stories.tsx for why the ui-components barrel is
// imported from source rather than through the `sanity` exports map.
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {Tab} from '../../../../packages/sanity/src/ui-components/tab/Tab'

const meta: Meta<typeof Tab> = {
  title: 'Overlays & Navigation/Tab',
  component: Tab,
  parameters: {
    docs: {
      description: {
        component: [
          'Tab is the one button behind every tabbed view in Studio: a field-group tab, a ' +
            'Review changes panel, and the Tasks sidebar all read as the same control rather than ' +
            'three components that happen to look similar.',
          '',
          '|            |                                                                                                                                                                                                                                       |',
          '| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source     | `packages/sanity/src/ui-components/tab/Tab.tsx`, the Studio shadow of `@sanity/ui` `Tab`                                                                                                                                              |',
          '| Tier       | SERVICE. Fixes padding (`2`) and `muted`, narrowing the primitive to Studio’s tab look, and adds an `iconRight` slot the primitive lacks                                                                                              |',
          '| Audit      | 🟢 holds (`module-tabs`, `alternative-views`). Tabbed switching between views of one region is competent in Studio; the layout-chapter defects the audit found sit elsewhere (`center-stage`, `collapsible-panels`, `movable-panels`) |',
          '| Patterns   | `module-tabs` · `alternative-views`                                                                                                                                                                                                   |',
          '| Call sites | field groups (`ObjectInput/fieldGroups/GroupTab.tsx`) · Review changes (`ChangesTabs`) · release filters (`ReleaseDocumentFilterTabs`) · Tasks sidebar (`TasksListTabs`)                                                              |',
          '',
          'It is the primitive to compose for any surface where one pane offers a handful of ' +
            'alternative views, and it already looks like the rest of Studio.',
          '',
          'That consistency is the point of the shadow. It takes a subset of `@sanity/ui` `Tab` ' +
            'props (`aria-controls`, `focused`, `icon`, `id`, `label`, `selected`, `tone`) and ' +
            'pins padding to `2` and `muted` on, so a tab a little too tall or a little too loud ' +
            'cannot accidentally ship. The added `iconRight` slot ' +
            '([sanity-io/ui#2173](https://github.com/sanity-io/ui/pull/2173)) is what lets a tab ' +
            'double as the `More` overflow menu (see the icons story).',
          '',
          '> **Why it matters:** padding and font size are deliberately _not_ configurable ' +
            'here. Reaching for a different size means reaching for the wrong component; every ' +
            'tab in Studio is meant to read the same, and that uniformity is what the shadow ' +
            'exists to guarantee.',
          '',
          'The last story shows it in context: a document pane header for the book _Anna ' +
            'Karenina_, its views, Editor, Preview, History, riding a `TabList` across the top of ' +
            'the pane and swapping the panel below without leaving the document.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:layout',
    'chapter:ia',
    'pattern:module-tabs',
    'pattern:alternative-views',
    'audit:holds',
    'source:studio-shadow',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof Tab>

/**
 * The raw `@sanity/ui` primitive, which exposes padding/size the shadow locks
 * down.
 */
export const Primitive: Story = {
  render: () => (
    <UITab aria-controls="p" id="primitive-tab" label="Primitive tab" selected onClick={() => {}} />
  ),
}

/**
 * The Studio shadow: fixed padding and muted styling. Selected vs unselected.
 */
export const Default: Story = {
  render: () => (
    <Flex gap={2}>
      <Tab aria-controls="p1" id="tab-selected" label="Selected" selected onClick={() => {}} />
      <Tab
        aria-controls="p2"
        id="tab-unselected"
        label="Unselected"
        selected={false}
        onClick={() => {}}
      />
    </Flex>
  ),
}

/**
 * `tone` across the DS palette.
 */
export const Tones: Story = {
  render: () => (
    <Flex gap={2}>
      {(['default', 'primary', 'positive', 'caution', 'critical'] as const).map((tone) => (
        <Tab
          key={tone}
          aria-controls={`tone-${tone}`}
          id={`tab-tone-${tone}`}
          label={tone}
          selected
          tone={tone}
          onClick={() => {}}
        />
      ))}
    </Flex>
  ),
}

/**
 * A leading `icon`, plus the shadow-only `iconRight` slot driving a real overflow
 * dropdown. The chevron tab is the `More` menu: click it to reveal the overflow
 * views (`module-tabs` handles a handful of tabs; the rest collapse behind `More`).
 * Selecting one activates it, then the tab shows that view's icon and label and
 * reads as selected, exactly as an in-pane overflow tab does.
 */
export const WithIcons: Story = {
  render: () => {
    const OVERFLOW = [
      {id: 'history', label: 'History', icon: RestoreIcon},
      {id: 'references', label: 'References', icon: LinkIcon},
    ] as const
    function Demo() {
      const [active, setActive] = useState<'content' | 'history' | 'references'>('content')
      const overflow = OVERFLOW.find((view) => view.id === active)
      return (
        <Flex gap={2}>
          <Tab
            aria-controls="i1"
            id="tab-icon"
            icon={DocumentIcon}
            label="Content"
            selected={active === 'content'}
            onClick={() => setActive('content')}
          />
          <MenuButton
            id="tab-more-menu"
            button={
              <Tab
                aria-controls="i2"
                id="tab-icon-right"
                icon={overflow?.icon}
                label={overflow ? overflow.label : 'More'}
                iconRight={<ChevronDownIcon />}
                selected={active !== 'content'}
              />
            }
            menu={
              <Menu>
                {OVERFLOW.map((view) => (
                  <MenuItem
                    key={view.id}
                    icon={view.icon}
                    text={view.label}
                    selected={active === view.id}
                    onClick={() => setActive(view.id)}
                  />
                ))}
              </Menu>
            }
          />
        </Flex>
      )
    }
    return <Demo />
  },
}

/**
 * The `module-tabs` pattern end to end: a `TabList` of Studio `Tab`s driving a
 * `@sanity/ui` `TabPanel`, swapping alternative views of one region without
 * leaving the pane. Wired with `id` / `aria-controls` for correct ARIA.
 */
export const ModuleTabs: Story = {
  render: () => {
    const VIEWS = [
      {id: 'content', label: 'Content', icon: DocumentIcon, body: 'The document’s fields.'},
      {id: 'media', label: 'Media', icon: ImageIcon, body: 'Images and files attached here.'},
      {id: 'settings', label: 'Settings', icon: CogIcon, body: 'Publishing and metadata.'},
    ]
    function Demo() {
      const [active, setActive] = useState('content')
      return (
        <Card padding={0} radius={2} style={{maxWidth: 420}}>
          <Box padding={2}>
            <TabList gap={1}>
              {VIEWS.map((view) => (
                <Tab
                  key={view.id}
                  aria-controls={`panel-${view.id}`}
                  id={`tab-${view.id}`}
                  icon={view.icon}
                  label={view.label}
                  selected={active === view.id}
                  onClick={() => setActive(view.id)}
                />
              ))}
            </TabList>
          </Box>
          {VIEWS.map((view) => (
            <TabPanel
              key={view.id}
              aria-labelledby={`tab-${view.id}`}
              hidden={active !== view.id}
              id={`panel-${view.id}`}
              style={{padding: '1rem'}}
            >
              <Text size={1}>{view.body}</Text>
            </TabPanel>
          ))}
        </Card>
      )
    }
    return <Demo />
  },
}

/**
 * In context, the document editor's view tabs. The tab bar in the seat Studio puts it: a
 * document pane header for the book *Anna Karenina*, its views riding a `TabList` across the top
 * of the pane, Editor (the form), Preview (how it renders on the site), and History (the edit
 * timeline). Click a tab to switch the panel below without leaving the document; the selected
 * tab reads active exactly as it does in the real editor.
 */
export const InContext: Story = {
  render: () => {
    const VIEWS = [
      {
        id: 'editor',
        label: 'Editor',
        icon: DocumentIcon,
        body: 'The form, title, author and body fields for “Anna Karenina”.',
      },
      {
        id: 'preview',
        label: 'Preview',
        icon: EyeOpenIcon,
        body: 'A live preview of how this book renders on the published site.',
      },
      {
        id: 'history',
        label: 'History',
        icon: RestoreIcon,
        body: 'The edit timeline, every change since this draft was created.',
      },
    ]
    function Demo() {
      const [active, setActive] = useState('editor')
      return (
        <Card radius={2} shadow={1} style={{maxWidth: 460}}>
          <Box padding={2} style={{borderBottom: '1px solid var(--card-border-color)'}}>
            <Box paddingX={1} paddingY={1}>
              <Text size={1} weight="medium">
                Anna Karenina
              </Text>
              <Box paddingTop={1}>
                <Text size={0} muted>
                  Book · Draft
                </Text>
              </Box>
            </Box>
            <Box paddingTop={2}>
              <TabList gap={1}>
                {VIEWS.map((view) => (
                  <Tab
                    key={view.id}
                    aria-controls={`ctx-panel-${view.id}`}
                    icon={view.icon}
                    id={`ctx-tab-${view.id}`}
                    label={view.label}
                    selected={active === view.id}
                    onClick={() => setActive(view.id)}
                  />
                ))}
              </TabList>
            </Box>
          </Box>
          {VIEWS.map((view) => (
            <TabPanel
              key={view.id}
              aria-labelledby={`ctx-tab-${view.id}`}
              hidden={active !== view.id}
              id={`ctx-panel-${view.id}`}
              style={{padding: '1rem'}}
            >
              <Text size={1}>{view.body}</Text>
            </TabPanel>
          ))}
        </Card>
      )
    }
    return <Demo />
  },
}
