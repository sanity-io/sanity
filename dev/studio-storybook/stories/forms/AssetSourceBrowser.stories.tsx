import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {ImagesIcon} from '@sanity/icons/Images'
import {UploadIcon} from '@sanity/icons/Upload'
import {type AssetSource} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {userEvent, within} from 'storybook/test'

// Real component from a real path (org contract §8).
import {
  AssetSourceBrowser,
  getDataTestIdPrefix,
} from '../../../../packages/sanity/src/core/form/inputs/files/common/AssetSourceBrowser'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {WithAssetLimitUpsell} from '../../lib/mockAssetFixtures'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Fixture asset sources ───────────────────────────────────────────────
   `AssetSource.component` is required by the type but never read here - `AssetSourceBrowser`
   only lists sources and forwards the chosen one upward via `onSelectAssetSource`; the
   component that would actually open is a different surface entirely. A no-op satisfies the
   type without pretending to render a dialog this component does not own. */

const NoopSourceComponent: AssetSource['component'] = () => null

const uploadSource: AssetSource = {
  name: 'sanity-upload',
  // oxlint-disable-next-line no-deprecated -- title stays optional and is still read as a display fallback in real components; these stories have no live i18n bundle wired in for a fabricated i18nKey to resolve against
  title: 'Upload',
  icon: UploadIcon,
  component: NoopSourceComponent,
}

const mediaLibrarySource: AssetSource = {
  name: 'media-library',
  // oxlint-disable-next-line no-deprecated -- title stays optional and is still read as a display fallback in real components; these stories have no live i18n bundle wired in for a fabricated i18nKey to resolve against
  title: 'Media Library',
  icon: ImagesIcon,
  component: NoopSourceComponent,
}

const unsplashSource: AssetSource = {
  name: 'unsplash',
  // oxlint-disable-next-line no-deprecated -- title stays optional and is still read as a display fallback in real components; these stories have no live i18n bundle wired in for a fabricated i18nKey to resolve against
  title: 'Unsplash',
  icon: EarthGlobeIcon,
  component: NoopSourceComponent,
}

/**
 * No `title` and no `icon` - exercises both fallback chains for real: `getAssetSourceDisplayName`
 * (assetSourceUtils.ts:37-45) falls back to `startCase(source.name)`, and the menu item icon
 * falls back to the generic `ImageIcon` (AssetSourceBrowser.tsx:80).
 */
const legacyPluginSource: AssetSource = {
  name: 'legacy-plugin',
  component: NoopSourceComponent,
}

const singleSource: AssetSource[] = [uploadSource]
const multiSources: AssetSource[] = [
  uploadSource,
  mediaLibrarySource,
  unsplashSource,
  legacyPluginSource,
]

/** Matches the real root name of the `file` schema type - `getDataTestIdPrefix` special-cases
 * only `sanity.video` (AssetSourceBrowser.tsx:16), everything else keys off this directly. */
const fileSchemaType = {name: 'file', jsonType: 'object' as const}
const testIdPrefix = getDataTestIdPrefix(fileSchemaType)

function Browser(props: {
  assetSources: AssetSource[]
  readOnly?: boolean
  schemaType?: {name?: string; jsonType?: string; options?: {sources?: AssetSource[]}}
  testId: string
}) {
  const {assetSources, readOnly, schemaType = fileSchemaType, testId} = props
  return (
    <Card border padding={3} radius={0} data-testid={testId} style={{width: 320}}>
      <AssetSourceBrowser
        assetSources={assetSources}
        readOnly={readOnly}
        schemaType={schemaType}
        onSelectAssetSource={() => undefined}
      />
    </Card>
  )
}

/* ── The in-context host ─────────────────────────────────────────────────
   One document type whose file field declares the same four sources through
   `options.sources`, exactly how a real schema would configure them - a plain array of real
   `AssetSource` literals, which is all `options.sources` has ever been. */

const schemaTypes = [
  {
    name: 'pressKitDoc',
    title: 'Book',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {
        name: 'pressKit',
        title: 'Press kit',
        type: 'file',
        options: {sources: multiSources},
      },
    ],
  },
]

const meta: Meta = {
  title: 'Forms & Input/AssetSourceBrowser',
  parameters: {
    docs: {
      description: {
        component: [
          'A field configured with three source plugins collapses, once read-only, to a single ' +
            'disabled button naming whichever source happens to be first in the array, an ' +
            'accident of declaration order, not a decision anyone made about which source to ' +
            'show.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/files/common/AssetSourceBrowser.tsx` |',
          '| Tier | SERVICE. The source picker for the same asset-service seam `FileInput` and `ImageInput` sit on, factored out so File, Image and Video inputs all choose a source through one component |',
          '| Audit | 🟡 needs-work (`source-visibility`). Read-only does not just disable the picker, it removes the ability to see that a choice ever existed |',
          '| Patterns | `source-visibility` |',
          '',
          'Not the asset picker dialog itself, the small control in front of it. Given a list of ' +
            'configured sources, it decides whether to show one plain "Browse" button or a menu ' +
            'of them, and hands the chosen `AssetSource` upward. `FileInput` and `ImageInput` ' +
            'both call it from their empty/upload-placeholder state (`FileAsset.tsx`, ' +
            '`ImageInput.tsx`); once an asset is bound, a different surface (`ActionsMenu`) takes ' +
            'over, so this component only ever appears before something is attached.',
          '',
          '**What reading it turned up.**',
          '',
          '<details><summary><b>One source collapses correctly.</b></summary>\n\n' +
            '`assetSources.length > 1 && !readOnly` (:59) is the only way into the menu branch. ' +
            'With one source it is always false, so the plain `Button` (:90-99) wires straight to ' +
            '`handleSelect(assetSources[0])`, one click, no menu to open first. The common case is ' +
            'not the one this component makes worse.\n\n</details>',
          '',
          '<details><summary><b>Read-only does not just disable the menu, it deletes the fact that one exists.</b></summary>\n\n' +
            'The same condition (:59) that gates the menu also gates on `!readOnly`, so a ' +
            'read-only field with four configured sources takes the exact same branch as a field ' +
            'with one: the plain, disabled `Button` (:90-99), labelled and `data-testid`-keyed off ' +
            '`assetSources[0]` alone. A viewer of a read-only field sees one button naming the ' +
            'first configured source and has nothing in the render telling them three more ' +
            'exist.\n\n</details>',
          '',
          '<details><summary><b>"No sources" and "every source failed" render identically, because the component cannot tell them apart.</b></summary>\n\n' +
            '`sourcesFromSchema?.length === 0` (:53-55) and `assetSources.length === 0` (:57) both ' +
            '`return null`, no button, no message, no `Tooltip`. There is no loading state and no ' +
            'error state anywhere in this file; a source that was declared but failed to resolve ' +
            'upstream and a field that never had one configured are the same `null` to this ' +
            'component.\n\n</details>',
          '',
          '<details><summary><b>The first `return null` is provably dead code under both real callers.</b></summary>\n\n' +
            '`StudioFileInput.tsx:40` and `StudioImageInput.tsx:36` both compute `const ' +
            'assetSources = sourcesFromSchema || fileConfig.assetSources`, and an empty array is ' +
            'truthy in JS, so when a schema sets `options.sources: []`, `assetSources` is already ' +
            '`[]` by the time this component runs. The check at :53-55 and the check at :57 catch ' +
            'the same input for either shipped caller; the first only matters for a hand-rolled ' +
            'caller that decouples `assetSources` from `schemaType.options.sources`, which the ' +
            'type permits but neither real caller does.\n\n</details>',
          '',
          "<details><summary><b>The `MenuButton`'s own `data-testid` is not stable.</b></summary>\n\n" +
            "`${dataTestIdPrefix}-select-button-${menuButtonId.replace(/:/g, '-')}` (:72) " +
            'bakes a React-generated `useId()` value into the string. `menuButtonId` needs to be ' +
            'unique for the button/menu ARIA wiring; as a side effect, this is the one ' +
            '`data-testid` in the file nothing can hardcode. The per-source `MenuItem`s (:81) and ' +
            'the trigger `Button` (:67) do not have this problem, only the `MenuButton` wrapper ' +
            'itself does.\n\n</details>',
          '',
          '> **Why it matters:** read-only does not remove the ability to pick a source so much as ' +
            'it removes the ability to see that more than one exists. Three configured plugins ' +
            'shrink, once read-only, to a single disabled button naming whichever source happens ' +
            'to be first in the array.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}})],
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:source-visibility',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * One configured source: the menu branch (:59-88) never runs, so the field wires straight to
 * a plain, single-click `Button`.
 */
export const SingleSource: Story = {
  name: 'One configured source',
  render: () => <Browser assetSources={singleSource} testId="single-source" />,
}

/**
 * Four configured sources, not read-only: the `MenuButton` (:60-87) opens a plain
 * `@sanity/ui` `Menu`, one `MenuItem` per source. Played open on mount so the icon/label
 * fallback on the fourth item is visible without a click.
 *
 * `play` skips docs mode (below), so the docs page never runs the click that opens the menu -
 * it rendered the identical closed state as `SingleSource`/`ReadOnlyWithMultipleSources` above,
 * under a heading promising "(menu open)". `OverlayStoryNotice` (the same docs-mode stand-in
 * `FileUploadChrome.stories.tsx`'s `UploadDestinationPicker` stories use) replaces the docs
 * render with a link to the canvas, where the play function actually runs.
 */
export const MultipleSourcesOpen: Story = {
  name: 'Several configured sources (menu open)',
  render: function MultipleSourcesOpenRender(_args, {viewMode, id, name}) {
    if (viewMode === 'docs') return <OverlayStoryNotice title={name} storyId={id} />
    return <Browser assetSources={multiSources} testId="multi-source" />
  },
  play: async ({canvasElement, viewMode}) => {
    if (viewMode === 'docs') return
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId(`${testIdPrefix}-multi-browse-button`))
    // legacyPluginSource has no title: getAssetSourceDisplayName falls back to
    // startCase('legacy-plugin') (assetSourceUtils.ts:44).
    await within(canvasElement.ownerDocument.body).findByText('Legacy Plugin')
  },
}

/**
 * The same four sources, read-only. `assetSources.length > 1 && !readOnly` (:59) is false, so
 * this takes the single-button branch - disabled, and keyed to `assetSources[0]` alone. Compare
 * against the story above: three of the four configured sources leave no trace here.
 */
export const ReadOnlyWithMultipleSources: Story = {
  name: 'Several configured sources, read-only',
  render: () => <Browser assetSources={multiSources} readOnly testId="readonly-multi-source" />,
}

/**
 * `assetSources.length === 0` (:57): no button, no tooltip, no message. This is the render for
 * a field with no sources configured - and, per finding 3, indistinguishable from every source
 * having failed to resolve. The bordered box is empty on purpose.
 */
export const NoSourcesResolved: Story = {
  name: 'No sources resolved',
  render: () => <Browser assetSources={[]} testId="no-sources" />,
}

/**
 * `schemaType.options.sources?.length === 0` (:53-55): its own early return, checked first -
 * and, per finding 4, redundant with the check above under both shipped callers, since an
 * empty `sources` array is what `assetSources` already resolves to by the time this component
 * runs it. Same empty box as the story above; the difference is only in which line returns it.
 */
export const SourcesDisabledInSchema: Story = {
  name: 'Sources explicitly disabled (schema)',
  render: () => (
    <Browser
      assetSources={[]}
      schemaType={{name: 'file', jsonType: 'object', options: {sources: []}}}
      testId="sources-disabled"
    />
  ),
}

/**
 * In context: the browser as it actually appears - inside the empty-state upload placeholder
 * of a real file field (`pressKit`, on a "Book" document, beside its Title), configured with
 * the same four sources through `options.sources`. A live `FormBuilder`
 * (`lib/formBuilderHarness.tsx`) resolves the field for real; this is the everyday moment of
 * choosing where to browse from, not an isolated state chip.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <WithAssetLimitUpsell>
      <div style={{maxWidth: 640}}>
        <FormBuilderHarness
          id="fb-asset-source-browser-in-context"
          documentType="pressKitDoc"
          initialDocument={{title: 'Anna Karenina'}}
          height="auto"
        />
      </div>
    </WithAssetLimitUpsell>
  ),
}
