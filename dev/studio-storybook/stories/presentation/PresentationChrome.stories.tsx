import {Card, Stack} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

// Real Studio components imported from source (org contract §2 `Source:` line). These are
// presentation-tool chrome leaves; the tool itself (PresentationTool, comlink machines,
// the preview iframe) is intentionally NOT mounted — see the external-surfaces recon §1b.
import {presentationLocaleNamespace} from '../../../../packages/sanity/src/presentation/i18n'
import presentationResources from '../../../../packages/sanity/src/presentation/i18n/resources'
import {type PresentationLayoutTab} from '../../../../packages/sanity/src/presentation/panels/presentationLayoutTab'
import {PresentationNarrowTabBar} from '../../../../packages/sanity/src/presentation/panels/PresentationNarrowTabBar'
import {PresentationSpinner} from '../../../../packages/sanity/src/presentation/PresentationSpinner'
import {i18next} from '../../lib/i18n'

// The shared Storybook i18next (lib/i18n.ts) carries only the `studio` + `structure`
// namespaces; the tab bar translates against `presentation`. Register the real bundle
// synchronously so `useTranslation('presentation')` resolves the actual tab labels
// (Presentation / Navigator / Structure) — additive, disturbs no other story.
i18next.addResourceBundle('en-US', presentationLocaleNamespace, presentationResources, true, true)

/** Stateful host so clicking a tab actually moves the selection (the real onTabChange). */
function NarrowTabBarDemo(props: {navigatorEnabled?: boolean; initialTab?: PresentationLayoutTab}) {
  const {navigatorEnabled = false, initialTab = 'preview'} = props
  const [activeTab, setActiveTab] = useState<PresentationLayoutTab>(initialTab)
  return (
    <div style={{maxWidth: 480}}>
      <PresentationNarrowTabBar
        activeTab={activeTab}
        navigatorEnabled={navigatorEnabled}
        onTabChange={setActiveTab}
      />
    </div>
  )
}

const meta: Meta = {
  title: 'Overlays & Navigation/PresentationChrome',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'This page covers the two chrome pieces of Presentation that can be storied on their ' +
            'own: a narrow-viewport tab bar and a loading spinner. The full tool needs a running ' +
            'frontend in an iframe, state machines, and a live connection, so it cannot be ' +
            'mounted directly in a story.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/presentation/panels/PresentationNarrowTabBar.tsx` + `packages/sanity/src/presentation/PresentationSpinner.tsx`, Studio-only (no DS equivalent) |',
          "| Tier | CHROME. These frame the Presentation tool rather than carry content: a narrow-viewport tab bar that swaps the tool's three panes one at a time, and the loading spinner shown before the tool mounts. Neither reads content or a live connection |",
          '| Audit | ⚪ not-audited (`selective-attention`). The pattern-library audit never scored Presentation; the tab bar is the same view-switcher family the audit flagged as banner-blindable on the perspective/variant bar, and as a centered, labelled `TabList` with an explicit selected state it reads more legibly than that bar |',
          '| Patterns | `selective-attention` |',
          '',
          'The narrow tab bar is what the tool folds down to on a small viewport: instead of ' +
            'showing preview, navigator, and structure side by side, it stacks them behind a ' +
            'labelled `TabList` swapped one at a time. Click a tab and the real `onTabChange` ' +
            'fires, the selected state is genuine, and the labels are translated against the real ' +
            '`presentation` i18n namespace (registered above), so these are the shipped strings, ' +
            'not fixtures. The spinner is simply what fills the frame while the tool boots.',
          '',
          '> **Why it matters:** the full Presentation tool cannot be mounted in isolation. ' +
            'Without a live frontend in an iframe the chrome paints but frames an empty box, and ' +
            'the connection hangs in a permanent connecting state forever, which is exactly why ' +
            'the recon verdict was chrome-only, and why these two leaves are all that render ' +
            'here.',
          '',
          'The last story shows both leaves in context: assembled into the tool frame mid-boot, ' +
            'the narrow tab bar above the still-spinning preview pane, exactly the empty box the ' +
            'recon describes.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:nav',
    'chapter:layout',
    'pattern:selective-attention',
    'audit:not-audited',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj

/**
 * The narrow-viewport tab bar with the navigator disabled: two tabs, Presentation
 * (preview) and Structure (the document pane). Click to move the selection: the real
 * `onTabChange` fires and the active tab updates.
 */
export const NarrowTabBar_Default: Story = {
  name: 'Narrow tab bar (no navigator)',
  render: () => <NarrowTabBarDemo />,
}

/**
 * With the navigator enabled, a third tab appears between Presentation and Structure,
 * the ordered tab set the tool exposes when a navigator is configured.
 */
export const NarrowTabBar_WithNavigator: Story = {
  name: 'Narrow tab bar (with navigator)',
  render: () => <NarrowTabBarDemo navigatorEnabled initialTab="navigator" />,
}

/**
 * Active-tab tone: the Structure (content) tab selected, showing the `selected` state the
 * bar tracks: the visible system-status the audit found missing on the perspective bar.
 */
export const NarrowTabBar_ContentActive: Story = {
  name: 'Narrow tab bar (structure active)',
  render: () => <NarrowTabBarDemo navigatorEnabled initialTab="content" />,
}

/**
 * The loading spinner shown while the Presentation tool boots: a centered `@sanity/ui`
 * `Spinner` that fills its container (`height="fill"`), shown here in a fixed-height frame
 * so the fill has something to fill.
 */
export const Spinner: Story = {
  name: 'Loading spinner',
  render: () => (
    <Card border radius={2} style={{height: 200, width: 480}}>
      <PresentationSpinner />
    </Card>
  ),
}

/**
 * **In context.** The two chrome leaves assembled into the tool frame as it boots: the
 * real narrow tab bar with **Presentation** selected sits above the preview pane, which
 * is still filled by the spinner while the tool reaches for your front end. This is the
 * whole of what the chrome renders on its own: the pane never fills with a live preview
 * here (that needs a running frontend in an iframe and a comlink connection), which is
 * exactly the recon verdict, not a harness gap. Tap **Structure** to swap the pane: the
 * selection is the real `onTabChange`.
 */
export const InContext: Story = {
  name: 'In context (tool frame, booting)',
  render: () => (
    <Stack gap={2} style={{maxWidth: 480}}>
      <NarrowTabBarDemo />
      <Card border radius={2} style={{height: 260}}>
        <PresentationSpinner />
      </Card>
    </Stack>
  ),
}
