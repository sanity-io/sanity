import {Box, Card, Flex, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {type LogoProps} from '../../../../packages/sanity/src/core/config/studio/types'
import {StudioLogo} from '../../../../packages/sanity/src/core/studio/components/navbar/StudioLogo'
import {NavbarProviders} from '../../lib/navbarHarness'
import {WithStudioProviders} from '../../lib/testProvider'

const studioConfig = {name: 'default', title: 'Acme Content', schema: {name: 'default', types: []}}

// LogoProps requires a `renderDefault`; the default logo never calls it (it IS the default), so
// a passthrough stub satisfies the type.
const logoProps: LogoProps = {title: 'Acme Content', renderDefault: (p) => <StudioLogo {...p} />}

const meta: Meta = {
  title: 'Navbar & Shell/Studio Logo',
  decorators: [WithStudioProviders({config: studioConfig})],
  parameters: {
    // Dead code, kept as a record; each story is a fixed illustration, nothing to drive.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'This page is the clearest example in the catalog of one failure mode: a component ' +
            'that mounts is not a component that is mounted. It renders the workspace title in ' +
            'medium weight, correctly, and the studio no longer mounts it.',
          '',
          '|        |                                                                                      |',
          '| ------ | ------------------------------------------------------------------------------------ |',
          '| Source | `packages/sanity/src/core/studio/components/navbar/StudioLogo.tsx`                   |',
          '| Tier   | CHROME                                                                               |',
          '| Status | dead code, ledger #61. Nothing imports `StudioLogo` outside its own barrel re-export |',
          '',
          '> ### Correction, 2026-07-26. This page previously described a seam that no longer ' +
            'exists.',
          '>',
          '> It said the logo was “the simplest override point in the studio”, replaced via ' +
            '`studio.components.logo` with the replacement receiving `renderDefault`. That was ' +
            'true when it was written and none of it is true now. **`studio.components.logo` has ' +
            'no consumer.** `studio-components-hooks/picks.ts` has pick functions for `toolMenu`, ' +
            '`navbar`, `layout` and `activeToolLayout`; there is no `pickLogoComponent` and no ' +
            '`useLogoComponent`. A studio registering the seam today gets no error, no warning, ' +
            'and no effect.',
          '>',
          '> `StudioLogo` itself is dead alongside it: nothing imports it outside its own ' +
            'barrel re-export. `StudioNavbar` renders `HomeButton` and `WorkspaceMenuButton` in ' +
            'that position. Both are storied, in `Navbar & Shell/Home Button` and the workspace ' +
            'menus.',
          '>',
          '> The seam is still declared on both public interfaces carrying an `@deprecated` tag ' +
            'that points at workspace `icon`. What the tag does not say is that this is not a ' +
            'deprecated-but-working seam, it is a removed one whose type and default component ' +
            'were left behind. Recorded as ledger #61.',
          '',
          '**Why this page is kept rather than deleted.** These stories rendered correctly and ' +
            'passed the render gate throughout the period the seam was being removed, because ' +
            '`StudioLogo` in isolation works fine. Nothing in a component-level catalog can ' +
            'detect that its caller went away.',
          '',
          'The stories below are therefore reclassified. They are no longer three ways to ' +
            'customise your studio; they are a record of a component the studio used to render, ' +
            'and the customisation prose has been removed from each.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:navbar', 'pattern:branding', 'source:studio', 'tier:chrome'],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'The component itself',
  parameters: {
    docs: {
      description: {
        story:
          'The component as it stands: the workspace `title` in medium weight. Plain text was the right default while it was mounted, because any mark Sanity shipped would have been wrong for every studio that is not Sanity.\n\nIt renders here because it is still exported and still correct in isolation. It does not render in a studio.',
      },
    },
  },
  render: () => (
    <NavbarProviders>
      <StudioLogo {...logoProps} />
    </NavbarProviders>
  ),
}

export const CustomMark: Story = {
  name: 'What branding used to look like',
  parameters: {
    docs: {
      description: {
        story:
          'A mark plus a wordmark, which is what a studio supplied through `studio.components.logo` when the seam was live. Kept as a record of the shape, not as instructions.\n\nThe replacement for this today is the **workspace `icon`**, which the deprecation notice on the type points at. That is a per-workspace value rather than a component, which is a narrower affordance and the reason this seam existed at all.',
      },
    },
  },
  render: () => (
    <NavbarProviders>
      <Box padding={3}>
        <Flex align="center" gap={2}>
          <Card
            radius="full"
            style={{width: 24, height: 24, background: 'linear-gradient(135deg,#f03e2f,#2276fc)'}}
          />
          <Text weight="semibold">Acme</Text>
        </Flex>
      </Box>
    </NavbarProviders>
  ),
}

export const DecoratedDefault: Story = {
  name: 'What decorating used to look like',
  parameters: {
    docs: {
      description: {
        story:
          'An environment badge beside the untouched default, which is the pattern `renderDefault` exists for and a genuinely good use of it: a staging studio unmistakable at a glance without anyone reimplementing anything.\n\nWorth keeping visible precisely because the capability went away with the seam. A workspace `icon` cannot express "the default, plus a badge". Anyone who wants this today has to reach for `studio.components.navbar` and rebuild more than they wanted to, which is the practical cost of finding #61 rather than a merely typographic one.',
      },
    },
  },
  render: () => (
    <NavbarProviders>
      <Flex align="center" gap={1}>
        <StudioLogo {...logoProps} />
        <Card padding={1} radius={2} tone="caution" border>
          <Text size={0} weight="medium">
            STAGING
          </Text>
        </Card>
      </Flex>
    </NavbarProviders>
  ),
}
