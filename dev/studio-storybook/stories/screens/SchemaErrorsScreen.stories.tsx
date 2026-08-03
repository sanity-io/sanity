import {type Schema, type SchemaValidationProblemGroup} from '@sanity/types'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SchemaErrorsScreen} from '../../../../packages/sanity/src/core/studio/screens/schemaErrors/SchemaErrorsScreen'
import {SchemaProblemGroups} from '../../../../packages/sanity/src/core/studio/screens/schemaErrors/SchemaProblemGroups'
import {ScreenFrame} from '../../lib/screenFrame'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * The screen reads exactly one thing off the schema - `_validation` - and hands it to
 * `SchemaProblemGroups`. Everything else on a `Schema` (get, has, getTypeNames) is unused by this
 * path, so a fixture only has to be honest about the shape of a problem group.
 *
 * `reportWarnings(schema)` runs in an effect and logs to the console. That is why these stories
 * include warnings as well as errors: the console output is part of the behaviour.
 */
function schemaWith(validation: SchemaValidationProblemGroup[]): Schema {
  return {
    name: 'default',
    _validation: validation,
    get: () => undefined,
    has: () => false,
    getTypeNames: () => [],
    getLocalTypeNames: () => [],
  } as unknown as Schema
}

const missingType: SchemaValidationProblemGroup = {
  path: [
    {kind: 'type', type: 'document', name: 'article'},
    {kind: 'property', name: 'fields'},
  ],
  problems: [
    {
      severity: 'error',
      message:
        'Found array member declaration with missing type.\nAll array members must have a type.',
      helpId: 'schema-array-of-type-required',
    },
  ],
}

const invalidReference: SchemaValidationProblemGroup = {
  path: [
    {kind: 'type', type: 'document', name: 'article'},
    {kind: 'property', name: 'fields'},
    {kind: 'type', type: 'reference', name: 'author'},
  ],
  problems: [
    {
      severity: 'error',
      message: 'The reference type "writer" is not defined in the schema.',
      helpId: 'schema-reference-to-invalid-type',
    },
  ],
}

const anonymousObject: SchemaValidationProblemGroup = {
  path: [{kind: 'type', type: 'object'}],
  problems: [
    {
      severity: 'error',
      message: 'Object types must have a name.',
    },
  ],
}

const namingWarning: SchemaValidationProblemGroup = {
  path: [{kind: 'type', type: 'document', name: 'blogPost'}],
  problems: [
    {
      severity: 'warning',
      message:
        'The type name "blogPost" is deprecated in favour of "post". This will keep working, but should be renamed.',
      helpId: 'schema-type-name-deprecated',
    },
  ],
}

const meta: Meta<typeof SchemaErrorsScreen> = {
  title: 'Navbar & Shell/Screens/Schema Errors',
  component: SchemaErrorsScreen,
  decorators: [WithStudioProviders()],
  render: (args) => (
    <ScreenFrame height={640}>
      <SchemaErrorsScreen {...args} />
    </ScreenFrame>
  ),
  parameters: {
    // `schema` is a Schema object, not a UI-controllable value; each story fixes its own.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'This screen replaces the entire studio when the schema does not compile. Not a ' +
            'warning banner over a working studio: the studio does not start.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/screens/schemaErrors/SchemaErrorsScreen.tsx` |',
          '| Tier | SERVICE |',
          '',
          'It lists every problem group with an error in it, each as a bordered card carrying a ' +
            'breadcrumb to the offending path, the message, and a link to the relevant docs page ' +
            'when the problem has a `helpId`.',
          '',
          "> **Why it matters:** this is the studio's compiler-error screen, and it is aimed " +
            'squarely at a developer with the schema file open. That shows in two choices. The ' +
            'path is rendered as a breadcrumb of code segments rather than a dotted string, so a ' +
            'path like article, fields, author reads as a route into the file rather than a ' +
            'symbol to decode. And a help ID becomes a real docs link, so a schema rule you have ' +
            'never met is one click from its explanation instead of a phrase to paste into a ' +
            'search engine.',
          '',
          '**The Copy to clipboard button is the quiet good idea.** It runs ' +
            '`formatSchemaErrorsToMarkdown` and puts the whole report on the clipboard as ' +
            'markdown - ready to paste into a pull request, an issue, or a chat with someone who ' +
            'can help. A screen full of errors is exactly the moment somebody wants to hand the ' +
            'errors to somebody else, and this is the only screen in the family that makes that a ' +
            'single click.',
          '',
          '**Warnings are shown but never block.** `groupsWithErrors` filters to groups ' +
            'containing at least one `error`, so a warning-only schema starts the studio normally ' +
            '- the warnings go to the console via `reportWarnings`. But a group that has an error ' +
            'AND a warning renders both. In the mixed story below, the caution-toned card only ' +
            'ever appears in the company of a critical one.',
          '',
          '**Harness note:** the screen reads only `schema._validation`, so these stories pass ' +
            'a minimal schema object rather than compiling a broken one. The rendering, the ' +
            'breadcrumb, the help links and the clipboard formatting are all real.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:shell',
    'pattern:error-messages',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof SchemaErrorsScreen>

export const SingleError: Story = {
  name: 'One error',
  args: {schema: schemaWith([missingType])},
  parameters: {
    docs: {
      description: {
        story:
          'The smallest real case: one array member declared without a type. Note the message contains a newline and the card preserves it (`white-space: pre-line`), so a two-sentence schema error keeps the line break its author wrote instead of running together.',
      },
    },
  },
}

export const MultipleErrors: Story = {
  name: 'Several errors',
  args: {schema: schemaWith([missingType, invalidReference, anonymousObject])},
  parameters: {
    docs: {
      description: {
        story:
          'Three problems across three paths. The screen does not rank or group them beyond the order the validator produced, which is the right restraint - it has no basis for deciding which broken schema rule matters most, and a wrong ordering would send someone to the wrong file first.\n\nThe third card is worth a look: an object type with no name at all, so `getTypeInfo` substitutes `<anonymous object>`. Even an unnameable problem gets a label rather than a blank breadcrumb.',
      },
    },
  },
}

export const WithWarnings: Story = {
  name: 'Errors and warnings together',
  args: {schema: schemaWith([missingType, namingWarning, invalidReference])},
  parameters: {
    docs: {
      description: {
        story:
          'A schema with both. The caution-toned warning card sits inline among the critical ones, distinguished by tone and by icon - a triangle instead of a circle - so it survives a grayscale render.\n\nThe subtlety: this screen never appears for warnings alone. `groupsWithErrors` requires at least one `error` in a group, so a warning is only ever seen here because something else already stopped the studio. On a healthy schema the same warnings are logged to the console by `reportWarnings` and nothing is shown at all.',
      },
    },
  },
}

/**
 * The list on its own. Storied separately because it is the reusable half: the screen is a
 * heading, a copy button and this, and it is this that does the work.
 */
export const ProblemGroupsAlone: Story = {
  name: 'SchemaProblemGroups on its own',
  parameters: {
    docs: {
      description: {
        story:
          'Rendered outside the screen, at the width a narrower container would give it. It is a `<ul>` of cards, one per problem rather than one per group - a group with three problems in it becomes three cards, because a reader fixing schema errors works problem by problem, not path by path.',
      },
    },
  },
  render: () => (
    <SchemaProblemGroups problemGroups={[missingType, invalidReference, namingWarning]} />
  ),
}
