import {type Preview} from '@storybook/react-vite'
import {themes} from 'storybook/theming'

import {withVariantFrame} from '../lib/variantFrame'
import {withDocsOverlayContext} from './decorators/withDocsOverlayContext.decorator'
import {withI18n} from './decorators/withI18n.decorator'
import {withSanityTheme} from './decorators/withSanityTheme.decorator'

// The real Studio font stacks (from @sanity/ui's theme). Inter is loaded in
// preview-head.html / manager-head.html; the mono stack is OS-native (no webfont).
const INTER =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Liberation Sans", Helvetica, Arial, system-ui, sans-serif'
const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'

const preview: Preview = {
  // Global autodocs: every component gets a docs page for free, so the
  // `parameters.docs.description.component` verdict docblock has somewhere to land
  // (Carbon Studio lesson — one line of config, docs everywhere).
  tags: ['autodocs'],
  decorators: [
    // First entry is the innermost wrapper, so this renders inside withSanityTheme's
    // ThemeProvider — its tone colors and Badge track the light/dark toggle. Frames
    // Recommended (proposal) / Current (as-shipped defect) stories per the naming
    // convention; no-ops on normal stories. See lib/variantFrame.tsx.
    withVariantFrame,
    withI18n,
    withSanityTheme({
      themes: {light: 'light', dark: 'dark'},
      defaultTheme: 'dark',
    }),
    // Last entry, so this is the OUTERMOST wrapper and every story-local
    // BoundaryElementProvider / PortalProvider (OverlayFrame, NamedPortalFrame,
    // FormBuilderHarness) still wins over it. Docs surface only; story mode is untouched.
    // See decorators/withDocsOverlayContext.decorator.tsx.
    withDocsOverlayContext,
  ],
  parameters: {
    actions: {argTypesRegex: '^on[A-Z].*'},
    backgrounds: {disabled: true},
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      theme: {
        ...themes.dark,
        fontBase: INTER,
        fontCode: MONO,
      },
    },
    layout: 'fullscreen',
    options: {
      storySort: {
        // Pins the 7 top-level groups to the organization scheme's reading order
        // (docs/workspace/storybook-briefs/studio-storybook-organization.md §1);
        // everything within a group falls back to alphabetical.
        method: 'alphabetical',
        order: [
          // The front door. Docs pages, no stories: the reading-order narrative made
          // explicit, the territory in five movements, and trails by errand. Exists because a
          // taxonomy orients nobody; the map was living in this very comment block where no
          // reader could see it. The nested order is load-bearing: within a group the sort
          // falls back to alphabetical, which would put 'The Docs Voice' above 'The Map' and
          // displace the front door with a style guide.
          'Start Here',
          ['The Map', 'The Docs Voice'],
          'Foundations',
          // Sits directly under Foundations because it is the same layer of the argument: tokens
          // and type describe the system, these are the atoms built from them, and every
          // component chapter below composes these. It was previously unpinned, so it fell to
          // '*' and sorted alphabetically to the very bottom of the sidebar, which read as an
          // appendix rather than a foundation.
          'UI v3 Primitives',
          'Actions & Commands',
          'Overlays & Navigation',
          // The studio shell, then the one subsystem inside it big enough to stand alone.
          // Search stays a top-level group rather than nesting under Navbar & Shell: it is a
          // stateful subsystem of ~130 files and ~45 stories, and folding it into the shell
          // chapter would bury the shell's own dozen stories underneath it.
          'Navbar & Shell',
          'Search',
          'Lists & Data',
          'Forms & Input',
          // What was one 28-page 'CMS Patterns' chapter, split seven ways. The order is a
          // workflow rather than a taxonomy: what a document IS, what it says about itself, who
          // is working on it with you, how it is versioned, when it ships.
          'Document Pane',
          'Document Banners',
          'Document Status',
          'Collaboration',
          'Versioning',
          'Scheduling',
          'Canvas',
          // Customisation sits after the component chapters on purpose: it documents the SEAMS
          // users extend Studio through, and every page in it is measured against a default that
          // the chapters above already story. Reading it first would be reading the answer before
          // the question.
          'Customisation',
          // Releases stands alongside CMS Patterns rather than inside it, on the same
          // reasoning that keeps Search out of Navbar & Shell: it is a subsystem of ~38
          // components spanning a tool, the document header, and its own dialog family, and
          // folding it in would bury the dozen stories CMS Patterns already has. Scheduled
          // Drafts and Variants stay under CMS Patterns — they are release-adjacent
          // primitives, not part of the releases tool.
          'Releases',
          'Laws & Behaviors',
          'Field Guide',
          'Envisioned',
          '*',
        ],
      },
    },
  },
}

export default preview
