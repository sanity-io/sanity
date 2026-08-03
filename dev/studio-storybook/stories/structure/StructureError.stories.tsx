import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NoDocumentTypesScreen} from '../../../../packages/sanity/src/structure/components/structureTool/NoDocumentTypesScreen'
import {StructureError} from '../../../../packages/sanity/src/structure/components/structureTool/StructureError'
import {SerializeError} from '../../../../packages/sanity/src/structure/structureBuilder/SerializeError'
import {PaneResolutionError} from '../../../../packages/sanity/src/structure/structureResolvers/PaneResolutionError'
import {ScreenFrame} from '../../lib/screenFrame'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * `StructureError` re-throws anything that is not a `PaneResolutionError`, so these fixtures build
 * the real error classes rather than plain `Error`s. That is not ceremony: the component's whole
 * behaviour comes from which class the `cause` is, and a plain Error would take the wrong branch
 * in every story.
 */
function serializeErrorFixture(): PaneResolutionError {
  const cause = new SerializeError(
    'Structure node is missing required `id` property',
    ['root', 'documentTypeList(blogPost)'],
    'child',
    'S.documentTypeList',
  ).withHelpUrl('structure-node-id-required' as never)

  return new PaneResolutionError({
    message: cause.message,
    cause,
    helpId: 'structure-node-id-required',
  })
}

function runtimeErrorFixture(): PaneResolutionError {
  const cause = new Error("Cannot read properties of undefined (reading 'documentTypeList')")
  cause.stack = [
    "TypeError: Cannot read properties of undefined (reading 'documentTypeList')",
    '    at structure (https://studio.example.com/static/structure.js:12:34)',
    '    at __WEBPACK_IMPORTED_MODULE_4___default.resolvePane (https://studio.example.com/static/index.js:1:9021)',
    '    at (...).resolveChild(...).serialize (https://studio.example.com/static/index.js:1:9188)',
  ].join('\n')

  return new PaneResolutionError({message: cause.message, cause})
}

function plainErrorFixture(): PaneResolutionError {
  return new PaneResolutionError({
    message: 'Module build failed: Unexpected token in structure.ts (14:2)',
  })
}

const meta: Meta = {
  title: 'Document Pane/Structure Errors',
  decorators: [WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'A component whose first act is to re-throw is making a real claim: it handles ' +
            "structure resolution failures, and anything else is somebody else's problem.",
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/components/structureTool/{StructureError,NoDocumentTypesScreen}.tsx` |',
          '| Tier | SERVICE |',
          '| Patterns | `error-messages` |',
          '',
          'These are the two full-screen states the structure tool shows instead of itself: one ' +
            'for a structure that will not compile, one for a schema with no document types in ' +
            'it. Unlike the state panes, these are not pane-shaped. There is no chain of columns ' +
            'left to preserve, because the thing that would have built the columns is what failed.',
          '',
          'What it does with the errors it does own is decide, per error, whether a stack trace ' +
            'helps. A structure-builder error is already a well-formed sentence with a path ' +
            'attached, so the stack is suppressed and the path is shown as a breadcrumb. A runtime ' +
            'type error has no useful message on its own, so the stack is shown, run through a ' +
            'formatter first that breaks builder chains onto separate lines, strips bundler cruft ' +
            "from function names, and removes the studio's own host from URLs so its frames read " +
            'as paths while third-party ones stay fully qualified. That is a component that has ' +
            'read a lot of these traces.',
          '',
          '> **Why it matters:** re-throwing anything it does not recognise is the opposite of the ' +
            'usual instinct to catch broadly, and it is right here. A generic "something went ' +
            'wrong" screen shown for a specific, diagnosable failure is worse than no screen at ' +
            'all, because it destroys the information that would have fixed it.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:cms', 'pattern:error-messages', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

export const SerializeErrorStory: Story = {
  name: 'A structure builder error',
  parameters: {
    docs: {
      description: {
        story:
          'The good case, if there is one. `SerializeError` carries a path through the structure definition and a `helpId`, so the screen can show where in the builder chain the mistake is, state the rule in a sentence, and link to the documentation for that specific rule.\n\nNo stack trace, deliberately: the builder already knows exactly what is wrong and where, and a stack would only show the internals of the serializer rather than the line the developer wrote. Note the path is rendered with a `➝` separator generated in CSS rather than in the markup, so it does not end up in a copy-paste.',
      },
    },
  },
  render: () => (
    <ScreenFrame height={520}>
      <StructureError error={serializeErrorFixture()} />
    </ScreenFrame>
  ),
}

export const RuntimeError: Story = {
  name: 'A runtime error in the structure file',
  parameters: {
    docs: {
      description: {
        story:
          "A `TypeError` thrown inside the structure callback. Here the message alone is useless, so the stack is shown - and it has been through `formatStack`, which is worth reading closely.\n\nThree substitutions. Builder chains are broken across lines, so `S.list().title().items()` is legible rather than one long run. Bundler cruft goes: the frame written as `__WEBPACK_IMPORTED_MODULE_4___default.resolvePane` renders here as `default.resolvePane`. And the studio's own host is stripped from URLs so its frames read as file paths.\n\nThat last one is scoped to `window.location.host`, which is why the frames below keep their `https://studio.example.com` prefix - the fixture is deliberately from a different origin than the page. Not a defect in the story: it is the rule working. Frames from your own bundle shorten to paths, frames from anywhere else stay fully qualified, and the asymmetry is itself information about where the error came from.",
      },
    },
  },
  render: () => (
    <ScreenFrame height={520}>
      <StructureError error={runtimeErrorFixture()} />
    </ScreenFrame>
  ),
}

export const BuildError: Story = {
  name: 'A build failure',
  parameters: {
    docs: {
      description: {
        story:
          'The third branch, and the one that looks like an omission until you know why. When the message contains "Module build failed", the stack is suppressed even though this is not a `SerializeError` - because in development with HMR that stack is bundler noise wrapped around the one line that matters.\n\nA hard-coded string match on an error message is the kind of thing that gets flagged in review as fragile. It is also, here, correct: the alternative is showing a developer forty frames of bundler internals in place of a syntax error with a line number.',
      },
    },
  },
  render: () => (
    <ScreenFrame height={420}>
      <StructureError error={plainErrorFixture()} />
    </ScreenFrame>
  ),
}

export const NoDocumentTypes: Story = {
  name: 'No document types in the schema',
  parameters: {
    docs: {
      description: {
        story: [
          'Not an error - a setup state. The schema compiled fine and simply declares no ' +
            'document types, so the structure tool has nothing to list. Caution-toned rather ' +
            'than critical, with a link to the schema documentation, because the reader is a ' +
            'developer partway through configuring a studio rather than someone whose studio ' +
            'has broken.',
          '',
          'It is the structural twin of `NoToolsScreen` in the studio-screens family: same ' +
            'layout, same icon, same three-part copy, one level further in. Seen together, the ' +
            'two are evidence that "nothing is configured yet" is a recurring state with a ' +
            'house style.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <ScreenFrame height={420}>
      <NoDocumentTypesScreen />
    </ScreenFrame>
  ),
}
