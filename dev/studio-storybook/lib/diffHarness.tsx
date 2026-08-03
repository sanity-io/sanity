import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {type ReactNode, useMemo} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'

// `@sanity/diff` is not a dependency of this storybook package, so Vite cannot resolve the bare
// specifier from here. Deep source import instead, which is the convention throughout this
// storybook and keeps the lockfile untouched. Same module the studio itself imports.
import {diffInput, wrap} from '../../../packages/@sanity/diff/src/index'
import {ChangeList} from '../../../packages/sanity/src/core/field/diff/components/ChangeList'
import {type ObjectDiff} from '../../../packages/sanity/src/core/field/types'
import {useSchema} from '../../../packages/sanity/src/core/hooks/useSchema'

/**
 * Harness for Studio's change-list (the "Review changes" panel).
 *
 * The important thing about this one is that **nothing is hand-authored**. `@sanity/diff` exports
 * the same `diffInput(wrap(from), wrap(to))` the studio itself calls, so a story provides two plain
 * documents and gets the real diff tree: real segment-level string diffs, real added/removed
 * annotations, real array-item matching. Hand-writing a `Diff` object would be the usual approach
 * and would prove nothing - the interesting behaviour lives in how the diff is COMPUTED, and a
 * fabricated diff skips exactly that.
 *
 * Which is also why the stories vary the DOCUMENTS rather than the components: `ChangeList`
 * dispatches each change to the renderer for its type, so changing a boolean and changing a slug
 * are different stories about the same component tree.
 *
 * Two contexts are needed and neither is obvious:
 *  - `DocumentChangeContext` carries the root diff, the schema type and the current value. Every
 *    field diff reads it to resolve its own path within the whole.
 *  - a `UserColorManager`, because diff annotations are coloured PER AUTHOR and
 *    `useUserColorManager()` throws without one. It is now seeded by `WithStudioProviders` - these
 *    stories are what found that it was missing, along with `ActiveWorkspaceMatcher`, which the
 *    change list also reaches for. Both are seeded centrally now rather than per story file.
 */

export interface DiffStageProps {
  /** The earlier document. Pass `{}` for "this document did not exist". */
  from: Record<string, unknown>
  /** The later document. */
  to: Record<string, unknown>
  /** Schema type name, resolved from the workspace schema. */
  typeName?: string
  /** Author id the changes are attributed to. Drives the annotation colour. */
  author?: string
  /** Restrict the list to named fields, as the real panel does when a field group is selected. */
  fields?: string[]
  /**
   * When false, an added field shows only its new value rather than "nothing → value".
   * The releases document diff sets this for documents that are new in a release.
   */
  showFromValue?: boolean
}

const noopWrapper = (props: {children: ReactNode}) => props.children

export function DiffStage({
  from,
  to,
  typeName = 'article',
  author = 'ada',
  fields,
  showFromValue = true,
}: DiffStageProps) {
  const schema = useSchema()
  const schemaType = schema.get(typeName) as ObjectSchemaType

  const rootDiff = useMemo(
    () =>
      diffInput(
        wrap({_type: typeName, ...from}, {author}),
        wrap({_type: typeName, ...to}, {author}),
      ) as ObjectDiff,
    [author, from, to, typeName],
  )

  if (!schemaType) {
    return <div>Unknown schema type: {typeName}</div>
  }

  return (
    <DocumentChangeContext.Provider
      value={{
        documentId: 'doc-1',
        schemaType,
        rootDiff,
        isComparingCurrent: false,
        FieldWrapper: noopWrapper as never,
        value: {_type: typeName, ...to} as Partial<SanityDocument>,
        showFromValue,
      }}
    >
      <ChangeList diff={rootDiff} schemaType={schemaType} fields={fields} />
    </DocumentChangeContext.Provider>
  )
}

/**
 * A schema covering the field families the change list has distinct renderers for.
 *
 * Deliberately one flat-ish type plus one nested object and one array: the point is to reach
 * `FieldChange` (a leaf change), `GroupChange` (a nested object with several changed fields inside
 * it) and the array-item path, which are three different components rather than three cases of one.
 */
export const diffSchemaTypes = [
  {
    name: 'seo',
    title: 'SEO',
    type: 'object',
    fields: [
      {name: 'metaTitle', title: 'Meta title', type: 'string'},
      {name: 'metaDescription', title: 'Meta description', type: 'text'},
      {name: 'noIndex', title: 'Hide from search engines', type: 'boolean'},
    ],
  },
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'summary', title: 'Summary', type: 'text'},
      {name: 'slug', title: 'Slug', type: 'slug'},
      {name: 'readingTime', title: 'Reading time (minutes)', type: 'number'},
      {name: 'featured', title: 'Featured', type: 'boolean'},
      {name: 'publishedAt', title: 'Published at', type: 'datetime'},
      {name: 'seo', title: 'SEO', type: 'seo'},
      {name: 'tags', title: 'Tags', type: 'array', of: [{type: 'string'}]},
    ],
  },
]

export const diffStudioConfig = {
  name: 'default',
  title: 'Acme Content',
  schema: {name: 'default', types: diffSchemaTypes},
}
