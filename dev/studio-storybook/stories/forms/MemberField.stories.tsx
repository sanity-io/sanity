import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from a real path (org contract §8).
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Why this page runs a live FormBuilder ───────────────────────────────────
   `MemberField` takes a resolved `FieldMember` plus five `renderX` callbacks that only
   ever come from `FormBuilder`'s own recursion. There is no bare-prop way to fake a
   member without reimplementing the form-state resolver. `FormBuilderHarness`
   (lib/formBuilderHarness.tsx) is the documented tool for exactly this: "for REAL
   resolved form members ... use FormBuilderHarness instead". Each story below is a
   real document, over a real schema, whose fields are chosen so the real `useFormState`
   resolver hands MemberField a member that lands on one specific branch. */

const schemaTypes = [
  {
    name: 'address',
    title: 'Address',
    type: 'object',
    fields: [
      {name: 'street', title: 'Street', type: 'string'},
      {name: 'city', title: 'City', type: 'string'},
    ],
    preview: {select: {title: 'street', subtitle: 'city'}},
  },
  {
    name: 'link',
    title: 'Link',
    type: 'object',
    fields: [
      {name: 'label', title: 'Label', type: 'string'},
      {name: 'url', title: 'URL', type: 'string'},
    ],
    preview: {select: {title: 'label', subtitle: 'url'}},
  },
  // Four single-purpose hosts, one per branch, so each story isolates the field
  // under discussion rather than showing all four at once.
  {
    name: 'objectFieldHost',
    title: 'Object field host',
    type: 'document',
    fields: [
      {name: 'name', title: 'Name', type: 'string'},
      {name: 'home', title: 'Home address', type: 'address'},
    ],
  },
  {
    name: 'primitivesFieldHost',
    title: 'Array of primitives host',
    type: 'document',
    fields: [
      {name: 'name', title: 'Name', type: 'string'},
      {name: 'tags', title: 'Themes', type: 'array', of: [{type: 'string'}]},
    ],
  },
  {
    name: 'objectsFieldHost',
    title: 'Array of objects host',
    type: 'document',
    fields: [
      {name: 'name', title: 'Name', type: 'string'},
      {name: 'links', title: 'Further reading', type: 'array', of: [{type: 'link'}]},
    ],
  },
  {
    name: 'primitiveFieldHost',
    title: 'Primitive field host',
    type: 'document',
    fields: [{name: 'headline', title: 'Headline', type: 'string'}],
  },
  // The combined host for the matrix: one document carrying all four field shapes, so
  // the resolver hands MemberField all four kinds of member in a single render pass.
  {
    name: 'profile',
    title: 'Profile',
    type: 'document',
    fields: [
      {name: 'name', title: 'Name', type: 'string'},
      {name: 'home', title: 'Home address', type: 'address'},
      {name: 'tags', title: 'Themes', type: 'array', of: [{type: 'string'}]},
      {name: 'links', title: 'Further reading', type: 'array', of: [{type: 'link'}]},
    ],
  },
]

const meta: Meta = {
  title: 'Forms & Input/MemberField',
  parameters: {
    // No meta-level `component`: each story drives state through resolved form member rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Every field row in every object and document in Studio passes through one dispatcher ' +
            'before anything else decides how to draw it. `MemberField` reads a resolved member and ' +
            'picks one of four shape renderers, and that four-way branch is the seam that lets Studio ' +
            'add a new field shape without teaching every input in the tree to recognize it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/members/object/MemberField.tsx` |',
          '| Tier | CORE. Every field in every object and document in the Studio is routed through this dispatcher before anything else decides how to draw it |',
          '| Audit | 🟡 needs-work (`type-dispatch`). The fallback branch that stands in for "unrecognised field" cannot be reached by any schema the Studio itself accepts, and one input that IS reachable is routed by declaration order rather than by its own shape |',
          '| Patterns | `type-dispatch` |',
          '| Branches | 4 guards (`isMemberObject`, `isMemberArrayOfPrimitives`, `isMemberArrayOfObjects`, `isMemberPrimitive`), one bare `return null` fallback |',
          '',
          'Not an input itself: `MemberField` reads one resolved `FieldMember` and decides which of ' +
            'four field-shape renderers gets it, `ObjectField`, `ArrayOfPrimitivesField`, ' +
            '`ArrayOfObjectsField`, or `PrimitiveField`. Every field row in the document pane passes ' +
            'through here first. The component has four `if` guards, each calling into ' +
            '`fields/asserters.ts`, and a bare `return null` after all four fail:',
          '',
          '```tsx',
          'if (isMemberObject(member)) return <ObjectField ... />',
          'if (isMemberArrayOfPrimitives(member)) return <ArrayOfPrimitivesField ... />',
          'if (isMemberArrayOfObjects(member)) return <ArrayOfObjectsField ... />',
          'if (isMemberPrimitive(member)) return <PrimitiveField member={member} renderField={renderField} renderInput={renderInput} />',
          'return null',
          '```',
          '',
          'Each story below is a real document over a real schema, run through the live `FormBuilder` ' +
            '(`lib/formBuilderHarness.tsx`) so the member `MemberField` receives is the product of the ' +
            'real `useFormState` resolver, not a hand-built object.',
          '',
          '**What reading it turned up.**',
          '',
          '<details><summary><b>The `return null` fallback is dead code for any schema the Studio will load.</b></summary>',
          '',
          'It exists to catch a member matching none of the four guards, but the array validator in ' +
            '`@sanity/schema` makes that state unreachable: `isMemberArrayOfPrimitives` requires every ' +
            '`of` member to be primitive and `isMemberArrayOfObjects` requires every `of` member to be ' +
            'an object type (`fields/asserters.ts:15-31`), and mixing the two in one array is a hard ' +
            'schema **error**, not a warning: ' +
            '`packages/@sanity/schema/src/sanity/validation/types/array.ts:156-171` reads "The array ' +
            "type's 'of' property can't have both object types and primitive types\". Every schema " +
            'type in Sanity compiles to `jsonType` `object`, `array`, `string`, `number`, or ' +
            '`boolean`; the four guards together already cover all of those (object maps to ' +
            '`isMemberObject`, a uniform-primitive or uniform-object array maps to one of the two ' +
            'array guards, and a primitive maps to `isMemberPrimitive`). A schema that produces a ' +
            'mixed array also fails to load past the schema-errors screen ' +
            '(`packages/sanity/src/core/studio/screens/schemaErrors/SchemaErrorsScreen.tsx`), so this ' +
            'branch is not merely rare, it is unreachable through any editing session.',
          '',
          '</details>',
          '',
          '<details><summary><b>A schema-authoring mistake is silently swallowed rather than surfaced.</b></summary>',
          '',
          '`isMemberArrayOfPrimitives` and `isMemberArrayOfObjects` both use `Array.prototype.every`, ' +
            'which is vacuously `true` on an empty array. An array field declared with `of: []` (no ' +
            "member types at all) is legal by the same validator's own rules, " +
            '`packages/@sanity/schema/src/sanity/validation/types/array.ts` raises no error or ' +
            'warning for it, and such a member satisfies **both** guards at once. Because ' +
            '`isMemberArrayOfPrimitives` is checked first, that field silently renders as ' +
            '`ArrayOfPrimitivesField`, with no indication anywhere on screen that the field declares ' +
            'zero allowed types. This is a real, reachable input (an easy accident from a spread or ' +
            'filter that empties an `of` array programmatically), and the two guards disagree about ' +
            'it in a way that is resolved only by which `if` happens to come first in the file. Not ' +
            'staged as a story here: what `ArrayOfPrimitivesField` and its input actually render with ' +
            'zero item types could not be confirmed without a live render this harness\'s own "do not ' +
            'assume it renders" caveat rules out, so it is reported rather than demonstrated.',
          '',
          '</details>',
          '',
          '> **Why it matters:** a dispatcher with a silent `null` fallback reads as defensive coverage ' +
            'for an edge case. It is not one here: the real gap is one call up, in `every()` treating ' +
            '"no declared types" the same as "all declared types agree", which lets a broken array ' +
            'definition pass as a normal one instead of surfacing as the misconfiguration it is.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
      previewStore: createMockDocumentPreviewStore({documents: []}),
    }),
  ],
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:type-dispatch',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/**
 * All four reachable branches at once: one document (`profile`) carrying a plain
 * string field, an object field, an array-of-primitives field and an array-of-objects
 * field, so the real resolver hands `MemberField` all four member kinds in the same
 * render pass. This is the comparison the page exists for.
 */
export const AllFourBranches: Story = {
  name: 'All four branches (matrix)',
  // This enumeration was folded twice over, on two different surfaces, for two different reasons.
  //
  // Docs surface: the inline canvas is 540px and the story was 660px, so the tail sat below the
  // page fold. That is what `docs.story.height` below fixes. The number accounts for the canvas
  // fix too: 40px of story chrome around a now-924px harness, plus 24px headroom.
  //
  // Canvas surface: `FormBuilderHarness` puts the form in a `ScrollContainer` whose height is the
  // `height` prop (formBuilderHarness.tsx:88-95, 316-324) with `overflow: auto`. This story asked
  // for 620px and the four branches need 900px, so measured before this change: `clientHeight` 620
  // against `scrollHeight` 900, 280px hidden, identical at 900px and 1200px viewports because the
  // cap is the prop and not the window. The fourth branch, the array of objects, sat inside an
  // internal scroll region rather than below the page, which is why no page-level height fix
  // reaches it. Raised to 924 (content plus the same 24px headroom) as a per-story override:
  // the harness default stays 480 and no other story is touched.
  parameters: {
    docs: {story: {height: '988px'}},
    controls: {include: []},
  },
  render: () => (
    <div style={{maxWidth: 560}}>
      <FormBuilderHarness
        id="member-field-matrix"
        documentType="profile"
        height={924}
        initialDocument={{
          name: 'Jorge Luis Borges',
          home: {_type: 'address', street: '994 Calle Maipú', city: 'Buenos Aires'},
          tags: ['labyrinths', 'mirrors', 'infinity'],
          links: [
            {
              _key: 'l1',
              _type: 'link',
              label: 'Borges: Collected Fictions',
              url: 'https://openlibrary.org/works/OL1234567W',
            },
            {
              _key: 'l2',
              _type: 'link',
              label: 'The Garden of Forking Paths (essay)',
              url: 'https://example.com/forking-paths',
            },
          ],
        }}
      />
    </div>
  ),
}

/**
 * `isMemberObject(member)`: `home` is typed `address`, an object schema type, so
 * `MemberField` routes it to `ObjectField` - the nested field group with its own
 * collapse/expand chrome.
 */
export const ObjectField: Story = {
  name: 'Object field',
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 520}}>
      <FormBuilderHarness
        id="member-field-object"
        documentType="objectFieldHost"
        height={340}
        initialDocument={{
          name: 'Jorge Luis Borges',
          home: {_type: 'address', street: '994 Calle Maipú', city: 'Buenos Aires'},
        }}
      />
    </div>
  ),
}

/**
 * `isMemberArrayOfPrimitives(member)`: `tags` is an array whose `of` is entirely
 * `string`, so `MemberField` routes it to `ArrayOfPrimitivesField` - the tag/chip-style
 * list editor.
 */
export const ArrayOfPrimitivesFieldStory: Story = {
  name: 'Array of primitives field',
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 520}}>
      <FormBuilderHarness
        id="member-field-array-primitives"
        documentType="primitivesFieldHost"
        height={300}
        initialDocument={{name: 'Ficciones', tags: ['labyrinths', 'mirrors', 'infinity']}}
      />
    </div>
  ),
}

/**
 * `isMemberArrayOfObjects(member)`: `links` is an array whose `of` is entirely the
 * `link` object type, so `MemberField` routes it to `ArrayOfObjectsField` - the
 * row-per-item list with previews, reordering and per-item editors.
 */
export const ArrayOfObjectsFieldStory: Story = {
  name: 'Array of objects field',
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 560}}>
      <FormBuilderHarness
        id="member-field-array-objects"
        documentType="objectsFieldHost"
        height={360}
        initialDocument={{
          name: 'Further reading',
          links: [
            {
              _key: 'l1',
              _type: 'link',
              label: 'Borges: Collected Fictions',
              url: 'https://openlibrary.org/works/OL1234567W',
            },
            {
              _key: 'l2',
              _type: 'link',
              label: 'The Garden of Forking Paths (essay)',
              url: 'https://example.com/forking-paths',
            },
          ],
        }}
      />
    </div>
  ),
}

/**
 * `isMemberPrimitive(member)`: `headline` is a bare `string`, so `MemberField` routes
 * it to `PrimitiveField` with only the two callbacks that renderer takes
 * (`renderField`, `renderInput`) - the leaf of the dispatch chain, and the only branch
 * that does not forward `renderItem`, `renderPreview`, `renderAnnotation` or
 * `renderBlock`, because a primitive has no children to recurse into.
 */
export const PrimitiveFieldStory: Story = {
  name: 'Primitive field',
  parameters: {controls: {include: []}},
  render: () => (
    <div style={{maxWidth: 480}}>
      <FormBuilderHarness
        id="member-field-primitive"
        documentType="primitiveFieldHost"
        height={220}
        initialDocument={{headline: 'The Library of Babel'}}
      />
    </div>
  ),
}
