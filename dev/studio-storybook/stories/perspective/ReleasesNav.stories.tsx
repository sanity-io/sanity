import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleasesNav} from '../../../../packages/sanity/src/core/perspective/navbar/ReleasesNav'
import {
  PerspectiveBarFrame,
  PerspectiveStoryRouter,
  WithPerspective,
} from '../../lib/perspectiveHarness'
import {releaseFixtures} from '../../lib/releaseFixtures'
import {fixtureReleases, WithStudioProviders} from '../../lib/testProvider'

const meta: Meta<typeof ReleasesNav> = {
  title: 'Navbar & Shell/Perspective/Releases Nav',
  component: ReleasesNav,
  render: (args) => (
    <PerspectiveStoryRouter>
      <PerspectiveBarFrame>
        <ReleasesNav {...args} />
      </PerspectiveBarFrame>
    </PerspectiveStoryRouter>
  ),
  parameters: {
    docs: {
      description: {
        component: [
          'This is the pill in the studio navbar that names which view of the content a person ' +
            'is currently editing, and opens the menu that changes it. Everything an editor sees ' +
            'below it, every document, every list, every preview, is filtered through whatever ' +
            'this says.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/perspective/navbar/ReleasesNav.tsx` |',
          '| Tier | SERVICE |',
          '| Patterns | `visible-system-state` |',
          '',
          'Three parts in a rounded container: an optional link to the Releases tool, the ' +
            'current perspective label, and a chevron button opening the perspective menu.',
          '',
          '**One rendering decision:** the whole nav is wrapped in `AnimatedTextWidth`, which ' +
            'animates the container width when the label changes. Switching perspective visibly ' +
            'moves the surrounding navbar. That is deliberate, the motion is the confirmation ' +
            'that the switch took, but it means anything laid out next to this control has to ' +
            'tolerate a neighbour that changes size.',
          '',
          '**Harness note:** these stories mount the real component over a real `createRouter` ' +
            'with a `releases` tool registered, because `ReleasesToolLink` encodes tool-scoped ' +
            'router state and throws on a router that has no scoped route for that tool name. The ' +
            'perspective itself is seeded per story, see `lib/perspectiveHarness.tsx`.',
          '',
          '> **Why it matters:** this is the highest-stakes small control in the studio, ' +
            'because it silently changes the meaning of everything else on screen. A document ' +
            'that looks published is published in this perspective; switch to a release and the ' +
            'same document shows different field values with no other visual change. So the ' +
            'control is designed to be permanently readable rather than merely available: the ' +
            'label is always visible, never collapsed to an icon, and it names the perspective in ' +
            'full rather than abbreviating it. A perspective switcher that only shows its state ' +
            'on hover would be a defect, not a design.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:shell',
    'chapter:cms',
    'pattern:visible-system-state',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof ReleasesNav>

export const Drafts: Story = {
  name: 'Viewing drafts',
  decorators: [WithPerspective('drafts'), WithStudioProviders({releases: fixtureReleases})],
  parameters: {
    docs: {
      description: {
        story:
          'The default, and where a studio sits almost all of the time: drafts layered over published content, which is what an editor means by "the current state of things". Click the chevron to open the menu.',
      },
    },
  },
}

export const Published: Story = {
  name: 'Viewing published only',
  decorators: [WithPerspective('published'), WithStudioProviders({releases: fixtureReleases})],
  parameters: {
    docs: {
      description: {
        story:
          'Published-only. Note what this does to the studio underneath: the perspective stack is empty, so drafts are not layered at all and every document shows exactly what a visitor to the live site would get. This is the read-only preview of reality, and the label is the only thing on screen saying so.',
      },
    },
  },
}

export const InARelease: Story = {
  name: 'Viewing a release',
  decorators: [
    WithPerspective(releaseFixtures.scheduled),
    WithStudioProviders({releases: fixtureReleases}),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A release selected. The label is no longer a static word but a link - clicking the release name navigates to that release in the Releases tool, via an `IntentLink` rather than a hard-coded URL. That is the difference that matters: drafts and published are states, a release is a *thing*, and the label reflects that by becoming navigable.\n\nThe title also runs through `ReleaseTitle`, so a long release name truncates at 50 characters with the full name on hover, and the pill has a hard `maxWidth: 180px` on top of that.',
      },
    },
  },
}

export const WithReleasesToolButton: Story = {
  name: 'With the Releases tool button',
  args: {withReleasesToolButton: true},
  decorators: [WithPerspective('drafts'), WithStudioProviders({releases: fixtureReleases})],
  parameters: {
    docs: {
      description: {
        story:
          "With `withReleasesToolButton`, a link to the Releases tool joins the pill on the left. It is gated twice - by the prop and by `useReleasesToolAvailable()` - so a studio without the tool never renders a link to it even if a caller asks for one. Worth noticing: the component treats a caller's request as a preference, not an instruction, because the caller cannot know whether the tool exists in this workspace.",
      },
    },
  },
}

export const NoBorder: Story = {
  name: 'Without a border',
  args: {border: false},
  decorators: [WithPerspective('drafts'), WithStudioProviders({releases: fixtureReleases})],
  parameters: {
    docs: {
      description: {
        story:
          'The borderless variant, for chrome that already provides a boundary. The control keeps its radius and padding, so it still reads as a single unit rather than three loose buttons - the border was never what was holding it together.',
      },
    },
  },
}

export const ReleasesDisabled: Story = {
  name: 'With releases disabled',
  decorators: [
    WithPerspective('drafts'),
    WithStudioProviders({config: {releases: {enabled: false}}}),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A workspace with releases turned off in config. The control does not disappear - drafts and published are still perspectives and still need switching between - but `areReleasesEnabled` goes false and the menu offers only the two system perspectives. Open it and compare with the Drafts story: same control, a much shorter menu.',
      },
    },
  },
}

export const NoReleasesYet: Story = {
  name: 'Releases enabled, none created',
  decorators: [WithPerspective('drafts'), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'Releases are available but none exist. This is the state every new studio is in, and it is a different state from "releases disabled" even though the closed pill looks identical. The distinction only appears when the menu is open, which is a fair argument that the closed control is under-informative here - though the counter-argument, that a navbar is not the place to advertise an empty feature, is also reasonable.',
      },
    },
  },
}
