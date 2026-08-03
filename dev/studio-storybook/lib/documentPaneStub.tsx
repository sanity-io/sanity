import {type SanityDocument} from '@sanity/client'
import {type ObjectSchemaType} from '@sanity/types'
import {type Decorator} from '@storybook/react-vite'
import {DocumentPaneContext, DocumentPaneInfoContext} from 'sanity/_singletons'

/**
 * A DELIBERATELY NARROW `useDocumentPane` stub, for the document banners.
 *
 * ## Read this before using it anywhere else
 *
 * The standing rule is: stub a dependency the component reads as **input**; refuse when the thing
 * stubbed **is** what the story tests. `useDocumentPane` sits on both sides of that line depending
 * on who is asking, so the distinction has to be made per consumer rather than per hook.
 *
 * - **`DocumentPane` itself** - the pane IS the subject. Stubbing it would story a fiction, and the
 *   `CMS Patterns/DocumentPane` stories correctly drive the real thing.
 * - **The banners** - each reads one to three plain data fields and then runs its OWN decision:
 *
 *   ```
 *   RevisionNotFoundBanner        revisionNotFound
 *   DeprecatedDocumentTypeBanner  schemaType            (via useDocumentPaneInfo)
 *   UnpublishedDocumentBanner     value, editState
 *   DeletedDocumentBanners        isDeleted, isDeleting, ready
 *   InsufficientPermissionBanner  documentId, schemaType
 *   DocumentNotInVariantBanner    value
 *   CanvasLinkedBanner            documentId, displayed
 *   ```
 *
 *   Eight fields, all data. The `if (!revisionNotFound) return null` that decides whether the
 *   banner exists is the BANNER's code, not the pane's - so feeding it a flag and watching it
 *   decide is a real test of the thing being storied.
 *
 * This file exists because that distinction was originally missed: the banners were left uncovered
 * on the grounds that stubbing the pane would be dishonest, which was true of the pane and false of
 * them. Faheem caught it on 2026-07-26.
 *
 * ## The limit
 *
 * Every field a real pane carries and this does not is a field a banner could read tomorrow and
 * get `undefined` for - passing here while crashing in a studio. So the stub lists its fields
 * explicitly rather than spreading a partial object behind a cast, and anything reaching for more
 * than the eight above should be driven through the real pane instead.
 */

export interface DocumentPaneStubOptions {
  documentId?: string
  documentType?: string
  schemaType?: ObjectSchemaType
  value?: Partial<SanityDocument> | null
  displayed?: Partial<SanityDocument> | null
  editState?: Record<string, unknown> | null
  revisionNotFound?: boolean
  isDeleted?: boolean
  isDeleting?: boolean
  ready?: boolean
  /**
   * The resolved document badges, for `Customisation/Document Badges`.
   *
   * A ninth field, added on the same test as the other eight. `DocumentBadges` reads `badges`
   * and `editState` and hands both straight to `RenderBadgeCollectionState`, which is what
   * actually calls the badge functions and renders their descriptions. So the pane is input
   * here and the resolution is the thing under test, which is the side of the line this stub
   * is allowed to serve.
   */
  badges?: unknown[] | null
}

const noop = () => undefined

export function makeSchemaType(
  name = 'article',
  extra: Record<string, unknown> = {},
): ObjectSchemaType {
  return {
    name,
    title: name[0].toUpperCase() + name.slice(1),
    type: {name: 'document', jsonType: 'object'},
    jsonType: 'object',
    fields: [],
    ...extra,
  } as unknown as ObjectSchemaType
}

export function WithDocumentPaneStub(options: DocumentPaneStubOptions = {}): Decorator {
  const {
    documentId = 'article-launch',
    documentType = 'article',
    schemaType = makeSchemaType(documentType),
    value = {_id: documentId, _type: documentType, title: 'The launch announcement'},
    displayed = value,
    editState = null,
    revisionNotFound = false,
    isDeleted = false,
    isDeleting = false,
    ready = true,
    badges = null,
  } = options

  // Listed field by field on purpose. A spread of `{...realPaneShape, ...options}` would hide
  // which fields the stories actually depend on, which is the information this file exists to keep.
  const paneValue = {
    documentId,
    documentType,
    schemaType,
    value,
    displayed,
    editState,
    revisionNotFound,
    isDeleted,
    isDeleting,
    ready,
    badges,
    // Below: present so a banner that touches them does not crash on `undefined`, but none of the
    // storied banners reads them. If a story starts depending on one of these, it has outgrown
    // this stub.
    onChange: noop,
    onPathOpen: noop,
    openInspector: noop,
    closeInspector: noop,
    inspector: null,
    inspectors: [],
    permissions: null,
    isPermissionsLoading: false,
    validation: [],
    views: [],
    activeViewId: null,
    index: 0,
    paneKey: 'stub',
    title: null,
    formState: null,
  }

  // `DeprecatedDocumentTypeBanner` reads `useDocumentPaneInfo()`, which is a separate context
  // carrying a Pick<> of the same values - so both have to be seeded or that one banner sees
  // nothing while the other seven work.
  return (Story) => (
    // oxlint-disable-next-line no-unsafe-type-assertion -- narrow by design; see the docblock
    <DocumentPaneContext.Provider value={paneValue as never}>
      {/* oxlint-disable-next-line no-unsafe-type-assertion */}
      <DocumentPaneInfoContext.Provider value={paneValue as never}>
        <Story />
      </DocumentPaneInfoContext.Provider>
    </DocumentPaneContext.Provider>
  )
}
