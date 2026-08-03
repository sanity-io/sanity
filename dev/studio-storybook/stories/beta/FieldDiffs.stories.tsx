import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FromTo} from '../../../../packages/sanity/src/core/field/diff/components/FromTo'
import {DiffStage, diffStudioConfig} from '../../lib/diffHarness'
import {WithStudioProviders} from '../../lib/testProvider'

const BASE = {
  title: 'The quiet rise of structured content',
  summary: 'A short look at why teams move away from page builders.',
  slug: {_type: 'slug', current: 'quiet-rise-of-structured-content'},
  readingTime: 6,
  featured: false,
  publishedAt: '2026-07-01T09:00:00.000Z',
  seo: {
    _type: 'seo',
    metaTitle: 'The quiet rise of structured content',
    metaDescription: 'Why teams move away from page builders.',
    noIndex: false,
  },
  tags: ['content-modelling', 'cms'],
}

function Panel({children}: {children: React.ReactNode}) {
  return (
    <Card border radius={2} padding={4} style={{maxWidth: 640}}>
      {children}
    </Card>
  )
}

const meta: Meta = {
  title: 'Document Status/Field Diffs',
  decorators: [WithStudioProviders({config: diffStudioConfig})],
  parameters: {
    docs: {
      description: {
        component: [
          'The Review changes panel does not compare two strings and hope an editor notices: it ' +
            'computes the diff for real, field by field, and almost all of the behaviour here ' +
            'lives in how that diff is computed rather than how it is drawn.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/field/diff/components/` |',
          '| Tier | SERVICE |',
          '| Patterns | `draft-publish-lifecycle` |',
          '| Mechanism | `ChangeList` walks a diff tree and dispatches each change to the renderer for its type: strings get segment-level highlighting, booleans get a from/to pair, nested objects get grouped, array items get matched up |',
          '',
          'There is no array diff renderer and no object diff renderer. `buildChangeList` ' +
            'expands both into per-item, per-field changes and dispatches each to its own type’s ' +
            'component. So "the tags array changed" is not a sentence this panel can produce, it ' +
            'names the item and the value instead, which is the only version an editor can act ' +
            'on.',
          '',
          'Diffs are built with `diffInput(wrap(from), wrap(to))` and rendered inside a real ' +
            '`DocumentChangeContext`. Annotation colours are per author, so the tinting comes ' +
            'from the user-colour manager rather than from a fixed palette.',
          '',
          '> **Why it matters:** these stories vary the documents, not the components, and ' +
            'everything below is computed by the real diff function the studio itself calls. That ' +
            'is not fastidiousness: it decides which array items count as the same item moved ' +
            'versus one removed and one added, where a string diff decides a word boundary is, ' +
            'whether an object with three edits is one change or three. Hand-authoring a diff ' +
            'object, the obvious way to story this, would skip precisely that and leave stories ' +
            'that only prove the renderers accept props.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:draft-publish-lifecycle',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const StringEdited: Story = {
  name: 'A string edited',
  parameters: {
    docs: {
      description: {
        story:
          'One word changed in a title. Notice the diff is **segment-level**, not whole-value: the unchanged text is plain, the removed run is struck through, the added run is highlighted, and they sit inline in one sentence rather than as two separate before/after blocks.\n\nThat is the difference between "here are two strings, compare them yourself" and "here is what changed". Hover a highlighted segment for its added/removed label.',
      },
    },
  },
  render: () => (
    <Panel>
      <DiffStage from={BASE} to={{...BASE, title: 'The quiet rise of structured content models'}} />
    </Panel>
  ),
}

export const StringRewritten: Story = {
  name: 'A string rewritten from scratch',
  parameters: {
    docs: {
      description: {
        story:
          'When the two values share almost nothing, the segment diff degrades gracefully into one removed run and one added run - which is the honest rendering. A word-level differ that tried harder here would find spurious common substrings and produce a shredded, unreadable result.',
      },
    },
  },
  render: () => (
    <Panel>
      <DiffStage
        from={BASE}
        to={{...BASE, summary: 'Structured content is a modelling discipline, not a tool choice.'}}
      />
    </Panel>
  ),
}

export const FieldAdded: Story = {
  name: 'A field added',
  parameters: {
    docs: {
      description: {
        story:
          'A field that had no value now has one. The panel shows an empty from-side rather than omitting it, so "this was blank" and "this was something else" stay distinguishable - a distinction that disappears the moment you render only the new value.',
      },
    },
  },
  render: () => (
    <Panel>
      <DiffStage from={{...BASE, publishedAt: undefined}} to={BASE} />
    </Panel>
  ),
}

export const FieldRemoved: Story = {
  name: 'A field cleared',
  parameters: {
    docs: {
      description: {
        story:
          'The inverse. Clearing a field is a change worth reporting as loudly as setting one, and it is the change most easily lost in a panel that only lists present values.',
      },
    },
  },
  render: () => (
    <Panel>
      <DiffStage from={BASE} to={{...BASE, summary: undefined}} />
    </Panel>
  ),
}

export const TypeMatrix: Story = {
  name: 'One change per field type',
  parameters: {
    docs: {
      description: {
        story:
          'String, text, slug, number, boolean and datetime all changed at once, so the renderers can be read against each other.\n\nThe boolean is the one to look at. It cannot do a segment diff - there is nothing to segment - so it falls back to an explicit from → to pair with an arrow. Same for the number and the datetime. The panel does not pretend every type supports the same treatment; it uses the richest rendering each type can carry.',
      },
    },
  },
  render: () => (
    <Panel>
      <DiffStage
        from={BASE}
        to={{
          ...BASE,
          title: 'The quiet rise of structured content models',
          summary:
            'A short look at why teams move away from page builders, and what replaces them.',
          slug: {_type: 'slug', current: 'quiet-rise-of-structured-content-models'},
          readingTime: 9,
          featured: true,
          publishedAt: '2026-07-24T16:30:00.000Z',
        }}
      />
    </Panel>
  ),
}

export const GroupedObject: Story = {
  name: 'Changes inside a nested object',
  parameters: {
    docs: {
      description: {
        story:
          'Two fields changed inside the `seo` object. They are grouped under a breadcrumb naming the object rather than listed flat at the top level, which is what `GroupChange` exists for.\n\nThe grouping is what keeps a panel readable on a document with deep content: without it, a change three levels down arrives with no indication of where it lives, and every change looks equally top-level.',
      },
    },
  },
  render: () => (
    <Panel>
      <DiffStage
        from={BASE}
        to={{
          ...BASE,
          seo: {
            ...BASE.seo,
            metaTitle: 'Structured content, quietly winning',
            noIndex: true,
          },
        }}
      />
    </Panel>
  ),
}

export const ArrayItems: Story = {
  name: 'Array items added and removed',
  parameters: {
    docs: {
      description: {
        story: [
          'The second tag replaced. There is **no array diff renderer** - `buildChangeList` ' +
            'expands the array into per-item changes and dispatches each to the renderer for ' +
            'the item type, here the string one.',
          '',
          'Watch what `diffInput` decided. It did not report one item removed and one added: ' +
            'it matched the two values at **position 2** and reported that position as changed. ' +
            'The row reads `#2 cms → #2 structured-content`, with the index carried on both ' +
            'sides. Position-matching is a guess, and it is the right guess far more often than ' +
            'not - most array edits are edits in place - but it means a genuine reorder can ' +
            'read as several simultaneous changes.',
          '',
          'Either way the panel names the values rather than saying "the tags array changed", ' +
            'which is the only version of that sentence an editor can act on.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Panel>
      <DiffStage from={BASE} to={{...BASE, tags: ['content-modelling', 'structured-content']}} />
    </Panel>
  ),
}

export const NewDocument: Story = {
  name: 'A document that did not exist',
  parameters: {
    docs: {
      description: {
        story:
          'Diffing against `{}`: every field reads as added. This is what the releases document diff shows for a document created inside a release, and it is the case that motivates `showFromValue` - see the next story.',
      },
    },
  },
  render: () => (
    <Panel>
      <DiffStage from={{}} to={BASE} />
    </Panel>
  ),
}

export const NewDocumentWithoutFromValues: Story = {
  name: 'A new document, without the empty from-side',
  parameters: {
    docs: {
      description: {
        story:
          'The same diff with `showFromValue: false`. Every field is still marked as added, but the empty from-side is dropped.\n\nCompare with the story above. When one thing was added among many unchanged fields, "nothing → value" is informative. When *everything* was added, a column of empty from-sides is a column of noise, and each row reads as though something was lost. Same data, and the right rendering depends on context the component cannot infer - hence a prop.',
      },
    },
  },
  render: () => (
    <Panel>
      <DiffStage from={{}} to={BASE} showFromValue={false} />
    </Panel>
  ),
}

export const NoChanges: Story = {
  name: 'Nothing changed',
  parameters: {
    docs: {
      description: {
        story:
          'Two identical documents. `ChangeList` renders its own empty state rather than returning null: a heading saying there are no changes, and a sentence telling you how to make some ("edit the document or select an older version in the timeline").\n\nThat second sentence is the part worth noticing. An empty Review changes panel is ambiguous - it could mean nothing changed, or it could mean you are looking at the wrong two versions - and the copy resolves the ambiguity by naming the control that would change the comparison. An empty state that only says "nothing here" leaves the reader to work out whether that is the answer or a mistake.',
      },
    },
  },
  render: () => (
    <Stack gap={3}>
      <Card border style={{borderStyle: 'dashed'}} radius={2} padding={4}>
        <DiffStage from={BASE} to={BASE} />
      </Card>
      <Text size={0} muted>
        the dashed box is the story frame; the change list itself rendered nothing
      </Text>
    </Stack>
  ),
}

export const FieldSubset: Story = {
  name: 'Restricted to named fields',
  parameters: {
    docs: {
      description: {
        story:
          "The same multi-field change, filtered to `title` and `readingTime` by the `fields` prop. This is how the panel narrows itself when a field group is selected, and it filters the RENDERED list rather than the diff - the other changes still exist, they are just not this view's business.",
      },
    },
  },
  render: () => (
    <Panel>
      <DiffStage
        from={BASE}
        to={{
          ...BASE,
          title: 'The quiet rise of structured content models',
          readingTime: 9,
          featured: true,
        }}
        fields={['title', 'readingTime']}
      />
    </Panel>
  ),
}

/**
 * The layout primitive underneath every non-string diff, storied alone because it is reusable and
 * its two layouts behave very differently.
 */
export const FromToLayouts: Story = {
  name: 'FromTo - the two layouts',
  parameters: {
    docs: {
      description: {
        story:
          '`FromTo` is the before → after primitive. `inline` keeps both sides on one line with the arrow between them, and is what short values use. `grid` gives each side an equal `minmax(0, 1fr)` column, so long values wrap within their own half instead of pushing the arrow off screen.\n\nThe `minmax(0, …)` matters more than it looks: with a plain `1fr` a long unbroken value refuses to shrink below its content width and the layout overflows. It is the standard CSS grid trap, and it is handled here.',
      },
    },
  },
  render: () => (
    <Stack gap={5} style={{maxWidth: 560}}>
      <Stack gap={3}>
        <Text size={0} muted>
          inline - short values
        </Text>
        <Card border radius={2} padding={3}>
          <FromTo
            layout="inline"
            from={<Text size={1}>6 minutes</Text>}
            to={<Text size={1}>9 minutes</Text>}
          />
        </Card>
      </Stack>
      <Stack gap={3}>
        <Text size={0} muted>
          grid - equal columns, each wrapping independently
        </Text>
        <Card border radius={2} padding={3}>
          <FromTo
            layout="grid"
            from={<Text size={1}>A short look at why teams move away from page builders.</Text>}
            to={
              <Text size={1}>
                Structured content is a modelling discipline rather than a tool choice, and the
                distinction shows up first in how teams talk about their fields.
              </Text>
            }
          />
        </Card>
      </Stack>
      <Stack gap={3}>
        <Text size={0} muted>
          to-side only - what an added value looks like
        </Text>
        <Card border radius={2} padding={3}>
          <FromTo layout="inline" to={<Text size={1}>9 minutes</Text>} />
        </Card>
      </Stack>
    </Stack>
  ),
}
