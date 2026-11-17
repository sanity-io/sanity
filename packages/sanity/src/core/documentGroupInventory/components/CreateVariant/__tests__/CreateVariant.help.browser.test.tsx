import {configure} from '@chromatic-com/vitest'
import {type ReleaseDocument} from '@sanity/client'
import {Card} from '@sanity/ui'
import {of} from 'rxjs'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'
import {type ActorRefFromLogic, createActor, fromObservable, setup} from 'xstate'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {activeASAPRelease} from '../../../../releases/__fixtures__/release.fixture'
import {type ReleasesReducerState} from '../../../../releases/store/reducer'
import {type VersionInfoDocumentStub} from '../../../../releases/store/types'
import {type VariantStoreState} from '../../../../variants/store/reducer'
import {type SystemVariant} from '../../../../variants/types'
import {type VariantSet} from '../../../machines/documentGroupInventoryMachine'
import {variantCreationMachine} from '../../../machines/variantCreationMachine'
import {CreateVariant} from '../CreateVariant'

// The tooltips and the source line are checked by their text, not archived.
configure({disableAutoSnapshot: true})

const GROUP_ID = 'summer-sale'

const NORDIC: SystemVariant = {
  _id: '_.variants.nordic',
  _type: 'system.variant',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  conditions: {},
  priority: 0,
  metadata: {title: 'Nordic region'},
}

function version(
  id: string,
  system: Partial<VersionInfoDocumentStub['_system']> = {},
): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    _type: 'author',
    _system: {group: {_ref: GROUP_ID, _weak: true}, ...system},
  }
}

const DEFAULT_PUBLISHED = version(GROUP_ID)
const DEFAULT_DRAFT = version(`drafts.${GROUP_ID}`, {bundleId: 'drafts'})
const NORDIC_PUBLISHED = version('nordic-published', {
  variants: [{_ref: NORDIC._id, _key: 'nordic'}],
})

/** Default is published and drafted, Nordic region is published. The ASAP release holds nothing. */
const SETS: VariantSet[] = [
  {
    key: 'published',
    name: 'Published',
    bundle: {type: 'perspective', perspective: 'published'},
    variants: [
      {id: DEFAULT_PUBLISHED._id, name: 'Default', document: DEFAULT_PUBLISHED},
      {id: NORDIC_PUBLISHED._id, name: 'Nordic region', document: NORDIC_PUBLISHED},
    ],
  },
  {
    key: 'drafts',
    name: 'Draft',
    bundle: {type: 'perspective', perspective: 'drafts'},
    variants: [{id: DEFAULT_DRAFT._id, name: 'Default', document: DEFAULT_DRAFT}],
  },
]

const VARIANTS: VariantStoreState = {variants: new Map([[NORDIC._id, NORDIC]]), state: 'loaded'}
const RELEASES: ReleasesReducerState = {
  releases: new Map<string, ReleaseDocument>([[activeASAPRelease._id, activeASAPRelease]]),
  state: 'loaded',
}

/** The form's machine reports to a parent when it opens, so it runs under one. */
function createVariantCreationRef() {
  const parent = createActor(
    setup({
      actors: {
        creation: variantCreationMachine.provide({
          actors: {
            variants: fromObservable(() => of(VARIANTS)),
            releases: fromObservable(() => of(RELEASES)),
          },
        }),
      },
    }).createMachine({invoke: {id: 'creation', src: 'creation', input: {}}}),
  ).start()
  const ref = parent.getSnapshot().children.creation as ActorRefFromLogic<
    typeof variantCreationMachine
  >
  ref.send({type: 'createVariant.request'})
  return ref
}

function Harness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={3}>
        {/* Room left of the form for the tooltips, as the document pane gives it in the studio */}
        <div style={{width: 360, marginLeft: 320}}>
          <CreateVariant
            variantCreationRef={createVariantCreationRef()}
            sets={SETS}
            documentTitle="Summer sale"
          />
        </div>
      </Card>
    </TestWrapper>
  )
}

async function open() {
  void render(<Harness />)
  await expect.element(page.getByTestId('create-variant-form')).toBeVisible()
}

const FIELDS = [
  {
    testId: 'create-variant-variant-menu',
    name: 'About Variant',
    text: 'Who will see this version. Each variant is an audience, set up in a variant definition.',
  },
  {
    testId: 'create-variant-target-menu',
    name: 'About Add to',
    text: 'The draft or release the new version goes into. It is published with that draft or release.',
  },
  {
    testId: 'create-variant-base-menu',
    name: 'About Start from',
    text: "What the new version copies. Nearest version copies this variant's published version. If there is none, it copies the Default: in Drafts its draft, or else its published version; in a release, its version in that release. You then change only what should differ, or pick another version to start from.",
  },
]

describe('Create variant form: info buttons', () => {
  it.each(FIELDS)(
    '$name is named and shows its tooltip on focus, beside the form',
    async (field) => {
      await open()
      const button = page.getByRole('button', {name: field.name, exact: true})
      await expect.element(button).toBeVisible()
      await expect.element(button).toHaveAttribute('data-testid', `${field.testId}-info`)

      button.element().focus()
      const tooltip = page.getByTestId(`${field.testId}-info-tooltip`)
      await expect.element(tooltip).toBeVisible()
      await expect.element(tooltip).toHaveTextContent(field.text)

      // The tooltip opens to the left of the form and never covers any of its fields
      const select = page.getByTestId(`${field.testId}-button`).element().getBoundingClientRect()
      const form = page.getByTestId('create-variant-form').element().getBoundingClientRect()
      const box = tooltip.element().getBoundingClientRect()
      expect(box.right).toBeLessThanOrEqual(form.left)

      // The button stays within the gap above its select
      const buttonBox = button.element().getBoundingClientRect()
      expect(buttonBox.bottom).toBeLessThanOrEqual(select.top)

      button.element().blur()
      await expect.element(tooltip).not.toBeVisible()
    },
  )

  it('shows a tooltip on hover', async () => {
    await open()
    await userEvent.hover(page.getByRole('button', {name: 'About Start from', exact: true}))
    await expect
      .element(page.getByTestId('create-variant-base-menu-info-tooltip'))
      .toHaveTextContent(FIELDS[2].text)
  })

  it('leaves the selects named by their titles alone', async () => {
    await open()
    await expect
      .element(page.getByTestId('create-variant-base-menu-button'))
      .toHaveAccessibleName('Start from Nearest version')
  })
})

describe('Create variant form: where Nearest version copies from', () => {
  const line = page.getByTestId('create-variant-base-menu-description')

  async function pick(testId: string, name: string) {
    await page.getByTestId(`${testId}-button`).click()
    await page.getByRole('menuitemradio', {name}).click()
    await expect.element(page.getByTestId(`${testId}-value`)).toHaveTextContent(name)
  }

  it('names the source under the select and follows Variant and Add to', async () => {
    await open()
    // No variant yet, in Drafts: the Default draft
    await expect.element(line).toHaveTextContent('Copies from Default in Drafts')
    await expect
      .element(page.getByTestId('create-variant-base-menu-button'))
      .toHaveAccessibleDescription('Copies from Default in Drafts')

    // A release with no version of the document: nothing to copy
    await pick('create-variant-target-menu', activeASAPRelease.metadata.title!)
    await expect.element(line).toHaveTextContent('Starts empty')

    await pick('create-variant-target-menu', 'Drafts')
    await expect.element(line).toHaveTextContent('Copies from Default in Drafts')

    // A variant that is published starts from its published version
    await pick('create-variant-variant-menu', 'Nordic region')
    await expect.element(line).toHaveTextContent('Copies from Nordic region in Published')
  })

  it('hides the line when a specific version is picked', async () => {
    await open()
    await expect.element(line).toBeVisible()
    await pick('create-variant-base-menu', 'Default · Published')
    await expect.element(line).not.toBeInTheDocument()
  })
})
