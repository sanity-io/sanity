import {type SanityDocument} from '@sanity/types'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SearchFilterAssetInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/asset/Asset'
import {AssetSourceError} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/asset/AssetSourceError'
import {FileReferencePreview} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/asset/preview/FileReferencePreview'
import {ImageReferencePreview} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/asset/preview/ImageReferencePreview'
import {SearchFilterReferenceInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/reference/Reference'
import {createMockDocumentPreviewStore} from '../../../lib/mockDocumentPreviewStore'
import {OverlayStoryNotice} from '../../../lib/overlayStoryNotice'
import {
  FilterInputFrame,
  OperatorInputStory,
  WithFilterProviders,
} from '../../../lib/searchFilterHarness'
import {SeedSearchState, searchSchemaTypes} from '../../../lib/searchHarness'
import {WithStudioProviders} from '../../../lib/testProvider'

/**
 * A second, small fixture universe for the two asset preview components. `searchFixtures.ts`
 * (the shared search dataset) deliberately has no `sanity.fileAsset` / `sanity.imageAsset`
 * documents in it - nothing in the filter system's own dataset is an asset, references and
 * assets are two different kinds of pointer - so there is nothing for `FileReferencePreview` /
 * `ImageReferencePreview` to resolve against there. These two documents exist only to give the
 * preview components something real to read, through the same `DocumentPreviewStore` seam
 * `Forms & Input/ReferenceInput` uses.
 */
const assetPreviewDocuments: SanityDocument[] = [
  {
    _id: 'sanity-file-brief',
    _type: 'sanity.fileAsset',
    _rev: 'rev-file-1',
    _createdAt: '2026-06-01T09:00:00Z',
    _updatedAt: '2026-06-01T09:00:00Z',
    originalFilename: 'q3-planning-brief.pdf',
    url: 'https://cdn.sanity.io/files/mock-project-id/mock-data-set/sanity-file-brief.pdf',
    size: 482304,
  },
  {
    _id: 'sanity-image-cover',
    _type: 'sanity.imageAsset',
    _rev: 'rev-image-1',
    _createdAt: '2026-06-01T09:00:00Z',
    _updatedAt: '2026-06-01T09:00:00Z',
    originalFilename: 'launch-cover.jpg',
    // A real image served from the storybook's static dir. It must be an HTTP URL, not a
    // data: URI: ImageReferencePreview builds its src as `${asset.url}?h=800&fit=max`, and
    // those appended params corrupt a data: URI so the preview spins on "Loading" forever.
    url: '/fixture-cover.svg',
    metadata: {dimensions: {width: 1600, height: 900, aspectRatio: 16 / 9}},
  },
]

const assetPreviewStore = createMockDocumentPreviewStore({documents: assetPreviewDocuments})

/**
 * A second provider stack, seeded with `assetPreviewStore`, layered *inside*
 * `WithFilterProviders()` for the stories that need it. Nesting it as a per-story decorator
 * (rather than threading a `previewStore` option through `WithFilterProviders` itself) keeps the
 * shared harness untouched - every other story in this file, and every other file that uses
 * `WithFilterProviders()`, is unaffected.
 *
 * The `config.schema` here must match `WithFilterProviders()`'s own (`searchSchemaTypes`), not the
 * default single-`author`-type mock schema `WithStudioProviders` falls back to. A story-level
 * decorator's workspace is the *inner* one - closest to the rendered tree - so anything inside it
 * that reads `useSchema()`, `SearchProvider`'s field-definition derivation included, sees this
 * schema, not the outer one. A mismatched schema here silently breaks the field lookup for every
 * story that uses this decorator (caught live: `attachment` stopped resolving a field definition
 * until this was added).
 */
const WithAssetPreviewStore = WithStudioProviders({
  previewStore: assetPreviewStore,
  config: {schema: {name: 'default', types: searchSchemaTypes}},
})

const meta: Meta = {
  title: 'Search/Filter Inputs/Reference and Asset',
  decorators: [WithFilterProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'Reference and asset filters need a document-reference picker, and a file or image ' +
            'picker that hands back a pointer to an asset document rather than a content ' +
            'document.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `.../search/components/filters/filter/inputs/reference/` and `.../asset/` |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '',
          'Both inputs share one shape: they emit `{_ref, _type}` where `_type` is the target ' +
            'document type (`author`, `sanity.fileAsset`, `sanity.imageAsset`), not the literal ' +
            '`"reference"` a document field would use. `SearchResultItem` and the asset preview ' +
            'components key off that `_type` to resolve a preview, so getting it right in a ' +
            'fixture matters.',
          '',
          '> **Why it matters:** every other operator input in this catalog turns a keystroke ' +
            'or a click into a value with no help from the network, a string, a number, a ' +
            "boolean. These two are the exception: the reference input's autocomplete runs a real " +
            'search query as you type, and the asset input opens a real asset-browsing dialog. ' +
            'They are the only filter inputs that do network work, and the only ones whose value ' +
            'depends on what a live Content Lake says exists.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
}

export default meta
type Story = StoryObj

/**
 * Backs `referenceEqual` / `referenceNotEqual` / `referencesDocument` on the `author` field.
 * Real Studio only offers this filter once the search is scoped to a document type that has an
 * `author` field, and the searchable-types computation the input does internally
 * (`fieldDefinition.documentTypes` intersected with the search's `documentTypesNarrowed`) depends
 * on that scoping - so this story seeds it with `SeedSearchState`, the same way a real filter
 * session would arrive at this state, rather than asserting a prop.
 */
export const ReferenceEmpty: Story = {
  name: 'Reference input, empty',
  parameters: {
    docs: {
      description: {
        story:
          'The resting state: no reference selected, so the component renders `ReferenceAutocomplete` directly. Its placeholder already knows what it is allowed to search - "Search for Author" - because the field definition narrows the autocomplete to the `author` document type before a single character is typed.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <SeedSearchState types={['article']} />
      <OperatorInputStory input={SearchFilterReferenceInput} fieldPath="author" />
    </FilterInputFrame>
  ),
}

/**
 * A resolved reference. This is the one story in the file that renders `SearchResultItem`'s real
 * preview pipeline (`useValuePreview`, `useGrantsStore`, `useDocumentPresence`) against a fixture
 * author from the shared search dataset (`author-ada`), rather than a hand-built stand-in.
 */
export const ReferenceFilled: Story = {
  name: 'Reference input, filled',
  parameters: {
    docs: {
      description: {
        story:
          'A bound reference to a real fixture author. The compact preview card and the "Clear" button are what replaces the autocomplete once a value exists - the two branches never render at once.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <SeedSearchState types={['article']} />
      <OperatorInputStory
        input={SearchFilterReferenceInput}
        fieldPath="author"
        initialValue={{_ref: 'author-ada', _type: 'author'}}
      />
    </FilterInputFrame>
  ),
}

/**
 * The autocomplete's open-button ("browse all") query, fired by the play function so the story
 * loads pre-opened. This runs a genuine GROQ search through the mock Content Lake - not a
 * fixture list rendered to look like results - narrowed to the `author` type by the field
 * definition, and it returns the fixture set's three real authors (Ada Okafor, Bo Lindqvist,
 * Mira Haddad).
 *
 * Typing narrows the same query: verified interactively against this harness, entering "mira"
 * debounces, re-runs the search with that query text, and the popover narrows to the single
 * matching author. That path is not captured as a permanent story because it depends on the
 * `Autocomplete`'s internal debounce timing rather than a value the harness can seed, but the
 * mechanism is the same open-button query this story pins, just with a non-empty `query` term.
 */
export const ReferenceAutocompleteOpen: Story = {
  name: 'Reference input, autocomplete open with results',
  parameters: {
    docs: {
      description: {
        story:
          "Click-to-open state of the autocomplete, showing every author in the fixture dataset. The search is real: change `searchFixtures.ts`'s author list and this list changes with it.",
      },
    },
  },
  // Skipped in docs view on purpose. A play function that opens a portalled popover is fine on its
  // own canvas, but a docs page renders every story in ONE document, so each opened popover stacks
  // a full-screen layer over the prose until the page is unreadable. Canvas view still gets the
  // real interaction. Because `play` never runs there, the docs page used to render this story's
  // CLOSED state under a heading promising "autocomplete open with results" - `OverlayStoryNotice`
  // replaces that with a link to the canvas instead, the same stand-in `FileUploadChrome.stories.
  // tsx`'s `UploadDestinationPicker` stories and `AssetSourceBrowser.stories.tsx`'s
  // `MultipleSourcesOpen` use for the same reason.
  render: function ReferenceAutocompleteOpenRender(_args, {viewMode, id, name}) {
    if (viewMode === 'docs') return <OverlayStoryNotice title={name} storyId={id} />
    return (
      <FilterInputFrame>
        <SeedSearchState types={['article']} />
        <OperatorInputStory input={SearchFilterReferenceInput} fieldPath="author" />
      </FilterInputFrame>
    )
  },
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const openButton = await waitForElement(canvasElement, 'button[aria-label="Open"]')
    openButton.click()
  },
}

/**
 * Backs `assetFileEqual` / `assetFileNotEqual` / `referencesAssetFile`. This harness's default
 * workspace config resolves a real (if minimal) dataset asset source - `createDatasetAssetSources`
 * builds it synchronously from just a client, with no network round-trip - so `assetSources.length`
 * is 1 here and the input renders the "Select" button, not `AssetSourceError`. See the error-state
 * story below for what an unconfigured studio shows instead, and why this harness cannot reach it
 * organically.
 */
export const AssetFileEmpty: Story = {
  name: 'Asset input (file), empty',
  parameters: {
    docs: {
      description: {
        story:
          'No file selected. "Select" opens the real dataset asset-browsing dialog (`DatasetAssetSource`) - untested past this point in this file, since the dialog is a whole surface of its own and this chapter is about the operator input\'s value contract, not the asset browser.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory input={SearchFilterAssetInput('file')} fieldPath="attachment" />
    </FilterInputFrame>
  ),
}

/**
 * The image counterpart. Same component factory, `type="image"`, same conclusion about asset
 * sources.
 */
export const AssetImageEmpty: Story = {
  name: 'Asset input (image), empty',
  parameters: {
    docs: {
      description: {
        story: 'No image selected - the image-typed sibling of the file story above.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory input={SearchFilterAssetInput('image')} fieldPath="coverImage" />
    </FilterInputFrame>
  ),
}

/**
 * A selected file, rendered through the real asset input (not the preview component in
 * isolation): `AssetPreview` resolves `sanity-file-brief` through the seeded preview store, so
 * this is what a filter chip's editing popover looks like once a file is chosen, including the
 * "Change" / "Clear" affordances the plain preview stories below do not have.
 */
export const AssetFileFilled: Story = {
  name: 'Asset input (file), filled',
  decorators: [WithAssetPreviewStore],
  parameters: {
    docs: {
      description: {
        story:
          'A bound file asset. The filename and size come from a real (fixture) `sanity.fileAsset` document resolved through `DocumentPreviewStore.observePaths` - the same read path production Studio uses.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterAssetInput('file')}
        fieldPath="attachment"
        initialValue={{_ref: 'sanity-file-brief', _type: 'sanity.fileAsset'}}
      />
    </FilterInputFrame>
  ),
}

/**
 * The component `SearchFilterAssetInput` falls back to when the workspace has no dataset asset
 * source configured (`assetSources.length === 0`). Rendered directly rather than through the
 * asset input, because this harness's default config always resolves the default dataset source
 * (see `AssetFileEmpty` above) - there is no config knob on `WithFilterProviders()` to remove it
 * without touching the shared harness. This is the honest shape of that state, not a live
 * reproduction of it.
 */
export const AssetSourceErrorState: Story = {
  name: 'Asset input, no asset source configured (unreachable here)',
  parameters: {
    docs: {
      description: {
        story:
          'Not reachable through this file\'s harness - included so the state is documented rather than silently missing. `SearchFilterAssetInput` renders exactly this in place of the "Select" button when `assetSources.length === 0`.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <AssetSourceError padding={3} />
    </FilterInputFrame>
  ),
}

/**
 * `FileReferencePreview` rendered directly against a real fixture `sanity.fileAsset` document
 * (through the seeded preview store above, not through the asset input). Filename and formatted
 * size both come off the resolved document.
 */
export const FilePreview: Story = {
  name: 'File preview, resolved',
  decorators: [WithAssetPreviewStore],
  parameters: {
    docs: {
      description: {
        story:
          'The bare preview component. `WithReferencedAsset` resolves the reference through `observeFileAsset`, which reads `originalFilename` / `size` off the document the seeded preview store hands back - a real read, on fixture data built for this story.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <FileReferencePreview reference={{_ref: 'sanity-file-brief', _type: 'sanity.fileAsset'}} />
    </FilterInputFrame>
  ),
}

/**
 * `ImageReferencePreview` rendered directly, resolving both the document and its pixels.
 *
 * Constrained to a narrow column on purpose: the preview is a square (`padding-bottom: 100%`), so
 * left to fill the width of a docs page it becomes a 1000px block of mostly nothing.
 */
export const ImagePreview: Story = {
  name: 'Image preview, resolved',
  decorators: [WithAssetPreviewStore],
  parameters: {
    docs: {
      description: {
        story:
          'Both halves are real here: the document lookup resolves out of the seeded preview ' +
          "store, and the pixels come from an actual image served out of the storybook's static " +
          'dir. It has to be a served file rather than an inlined one: `ImagePreview` builds ' +
          'its src as `${asset.url}?h=800&fit=max`, appending Sanity image-pipeline params ' +
          'unconditionally, which corrupts a `data:` URI and leaves the preview loading ' +
          'forever.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <div style={{maxWidth: 320}}>
        <ImageReferencePreview
          reference={{_ref: 'sanity-image-cover', _type: 'sanity.imageAsset'}}
        />
      </div>
    </FilterInputFrame>
  ),
}

function waitForElement(root: HTMLElement, selector: string, timeout = 8000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const poll = () => {
      const element = root.querySelector<HTMLElement>(selector)
      if (element) {
        resolve(element)
      } else if (Date.now() - startedAt > timeout) {
        reject(new Error(`Timed out waiting for ${selector}`))
      } else {
        setTimeout(poll, 100)
      }
    }
    poll()
  })
}
