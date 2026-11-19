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

// The Add to picker is checked by its rows and value, not archived.
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
const NORDIC_DRAFT = version('nordic-draft', {
  bundleId: 'drafts',
  variants: [{_ref: NORDIC._id, _key: 'nordic'}],
})

/** Default and Nordic region are both published and drafted. The ASAP release holds nothing. */
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
    variants: [
      {id: DEFAULT_DRAFT._id, name: 'Default', document: DEFAULT_DRAFT},
      {id: NORDIC_DRAFT._id, name: 'Nordic region', document: NORDIC_DRAFT},
    ],
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
        <div style={{width: 360}}>
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

async function pickVariant(name: string) {
  await userEvent.click(page.getByTestId('create-variant-variant-menu-button'))
  await userEvent.click(page.getByRole('menuitemradio', {name}))
}

describe('Create variant form: Add to for a variant that already has a draft', () => {
  it('keeps Drafts listed but not pickable, and does not pick a release for you', async () => {
    void render(<Harness />)
    await expect.element(page.getByTestId('create-variant-form')).toBeVisible()
    // Before a variant is picked, Add to starts on Drafts, the current perspective
    await expect
      .element(page.getByTestId('create-variant-target-menu-value'))
      .toHaveTextContent('Drafts')

    await pickVariant('Nordic region')

    // Add to stays empty instead of jumping to the first release, so Create waits for a pick
    await expect
      .element(page.getByTestId('create-variant-target-menu-value'))
      .toHaveTextContent('Choose where it goes')
    await expect.element(page.getByTestId('create-variant-confirm')).toBeDisabled()
    // Nearest version still names the variant's own published version, which needs no Add to
    await expect
      .element(page.getByTestId('create-variant-base-menu-description'))
      .toHaveTextContent('Copies from Nordic region in Published')

    await userEvent.click(page.getByTestId('create-variant-target-menu-button'))
    const menu = page.getByTestId('create-variant-target-menu')
    const drafts = menu.getByRole('menuitemradio', {name: /Drafts/})
    await expect.element(drafts).toBeVisible()
    await expect.element(drafts).toBeDisabled()
    await expect.element(drafts).toMatchTextContent(/Already has a draft/)

    await userEvent.click(menu.getByRole('menuitemradio', {name: /active asap Release/}))
    await expect
      .element(page.getByTestId('create-variant-target-menu-value'))
      .not.toHaveTextContent('Choose where it goes')
    await expect.element(page.getByTestId('create-variant-confirm')).toBeEnabled()
  })

  it('offers Drafts as usual for a variant with no draft', async () => {
    void render(<Harness />)
    await expect.element(page.getByTestId('create-variant-form')).toBeVisible()
    // Default has a draft too, but it is not a variant the form creates; with Nordic region
    // drafted, no variant here is free in Drafts, so check the empty state's Drafts row instead
    await userEvent.click(page.getByTestId('create-variant-target-menu-button'))
    const drafts = page.getByTestId('create-variant-target-menu').getByRole('menuitemradio', {
      name: /Drafts/,
    })
    await expect.element(drafts).toBeEnabled()
    await expect.element(drafts).not.toMatchTextContent(/Already has a draft/)
  })
})
