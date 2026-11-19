import {type ReleaseDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {BehaviorSubject} from 'rxjs'
import {PerspectiveContext} from 'sanity/_singletons'
import {afterEach, describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'
import {type ActorRefFromLogic, createActor, fromObservable, fromPromise, setup} from 'xstate'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type PerspectiveContextValue, type TargetPerspective} from '../../../perspective/types'
import {
  activeASAPRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {type ReleasesReducerState} from '../../../releases/store/reducer'
import {type VariantStoreState} from '../../../variants/store/reducer'
import {type SystemVariant} from '../../../variants/types'
import {type VariantSet} from '../../machines/documentGroupInventoryMachine'
import {type Variant} from '../../machines/selectionMachine'
import {variantCreationMachine} from '../../machines/variantCreationMachine'
import {Body} from '../Body'
import {Container} from '../Container'
import {CreateVariant} from '../CreateVariant/CreateVariant'
import {useCreateVariantRequest} from '../CreateVariant/useCreateVariantRequest'

const PUBLISHED_ID = 'request-document'
const DOCUMENT_TYPE = 'author'

const SCHEMA_TYPES = [
  defineType({
    name: DOCUMENT_TYPE,
    type: 'document',
    fields: [defineField({name: 'name', type: 'string'})],
  }),
]

const SUMMER_SALE: SystemVariant = {
  _id: '_.variants.summer-sale',
  _type: 'system.variant',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  conditions: {},
  priority: 0,
  metadata: {title: 'Summer sale'},
}

const PUBLISHED: Variant = {
  id: PUBLISHED_ID,
  name: 'Default',
  document: {
    _id: PUBLISHED_ID,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: DOCUMENT_TYPE,
    _system: {group: {_ref: PUBLISHED_ID, _weak: true}},
  },
}

const SETS: VariantSet[] = [
  {
    key: 'published',
    name: 'Published',
    bundle: {type: 'perspective', perspective: 'published'},
    variants: [PUBLISHED],
  },
]

/** The release in view, where Summer sale has no version yet. */
const RELEASE = activeUndecidedRelease

const PERSPECTIVE: PerspectiveContextValue = {
  selectedPerspectiveName: RELEASE.name,
  selectedReleaseId: RELEASE.name,
  selectedPerspective: RELEASE,
  perspectiveStack: [RELEASE.name, 'drafts'],
  excludedPerspectives: [],
  selectedVariantNames: ['summer-sale'],
  selectedVariants: [SUMMER_SALE],
  // oxlint-disable-next-line typescript/no-deprecated -- the context value still carries it
  selectedVariantName: 'summer-sale',
  // oxlint-disable-next-line typescript/no-deprecated -- the context value still carries it
  selectedVariant: SUMMER_SALE,
  bundle: RELEASE.name,
}

type CreateVariantInput = {
  variantDefinition: SystemVariant
  bundle: Exclude<TargetPerspective, 'published'>
  baseId: string | undefined
}

/** The parent the creation machine reports to, as `documentGroupInventoryMachine` is. */
function startCreation(options: {enabled?: boolean; createVariant: Mock}) {
  const parent = setup({
    types: {} as {
      context: {variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>}
      events: {type: 'variantCreation.activated'} | {type: 'variantCreation.deactivated'}
    },
  }).createMachine({
    context: ({spawn}) => ({
      variantCreationRef: spawn(
        variantCreationMachine.provide({
          actors: {
            variants: fromObservable(
              () =>
                new BehaviorSubject<VariantStoreState>({
                  state: 'loaded',
                  variants: new Map([[SUMMER_SALE._id, SUMMER_SALE]]),
                }),
            ),
            releases: fromObservable(
              () =>
                new BehaviorSubject<ReleasesReducerState>({
                  state: 'loaded',
                  releases: new Map<string, ReleaseDocument>([
                    [activeASAPRelease._id, activeASAPRelease],
                    [RELEASE._id, RELEASE],
                  ]),
                }),
            ),
            createVariant: fromPromise<void, CreateVariantInput>(({input}) =>
              options.createVariant(input),
            ),
          },
        }),
        {input: {enabled: options.enabled ?? true}},
      ),
    }),
  })
  const started = createActor(parent).start()
  actor = started
  return started.getSnapshot().context.variantCreationRef
}

let actor: {stop: () => void} | undefined
afterEach(() => {
  actor?.stop()
  actor = undefined
})

/** The inventory's header slot, as `DocumentGroupInventory` wires the request to it. */
function RequestHarness(props: {
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
  variantId: string | undefined
  onClose: () => void
}) {
  const {variantCreationRef, variantId, onClose} = props
  const isOpen = useSelector(variantCreationRef, (snapshot) => snapshot.matches('active'))
  useCreateVariantRequest({variantCreationRef, variantId, isOpen, onClose})
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <PerspectiveContext.Provider value={PERSPECTIVE}>
        <Card border radius={3} style={{display: 'flex', width: 360, height: 480}}>
          <Container>
            {isOpen ? (
              <CreateVariant
                focusCreate={typeof variantId !== 'undefined'}
                variantCreationRef={variantCreationRef}
                sets={SETS}
                documentTitle="Ursula K. Le Guin"
              />
            ) : (
              <div data-testid="inventory-header">Manage versions</div>
            )}
            <Body />
          </Container>
        </Card>
      </PerspectiveContext.Provider>
    </TestWrapper>
  )
}

const $variantTrigger = page.getByTestId('create-variant-variant-menu-button')
const $targetTrigger = page.getByTestId('create-variant-target-menu-button')
const $baseTrigger = page.getByTestId('create-variant-base-menu-button')
const $create = page.getByTestId('create-variant-confirm')

describe('useCreateVariantRequest', () => {
  it('opens the form filled in for the requested variant, with focus on Create, and Enter creates it', async () => {
    const {settleChromaticEndState} = testHelpers()
    let finish: () => void = () => {}
    const createVariant = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    const onClose = vi.fn()
    const variantCreationRef = startCreation({createVariant})

    void render(
      <RequestHarness
        variantCreationRef={variantCreationRef}
        variantId={SUMMER_SALE._id}
        onClose={onClose}
      />,
    )

    await expect.element($variantTrigger).toHaveTextContent('Summer sale')
    await expect.element($targetTrigger).toHaveTextContent(RELEASE.metadata.title)
    await expect.element($baseTrigger).toMatchTextContent('Nearest version')
    await expect.element($create).toBeEnabled()
    await expect.element($create).toHaveFocus()
    expect(onClose).not.toHaveBeenCalled()
    await settleChromaticEndState()

    await userEvent.keyboard('{Enter}')
    await expect.poll(() => createVariant.mock.calls.length).toBe(1)
    const [input] = createVariant.mock.lastCall as unknown as [CreateVariantInput]
    expect(input.variantDefinition._id).toBe(SUMMER_SALE._id)
    expect(input.bundle).toMatchObject({_id: RELEASE._id})
    // Start from stays on the nearest version, which is resolved when the variant is created
    expect(input.baseId).toBeUndefined()
    // Still creating: the request is not answered yet
    expect(onClose).not.toHaveBeenCalled()

    finish()
    await expect.element(page.getByTestId('inventory-header')).toBeVisible()
    await expect.poll(() => onClose.mock.calls.length).toBe(1)
  })

  it('answers the request when the form is cancelled', async () => {
    const onClose = vi.fn()
    const variantCreationRef = startCreation({createVariant: vi.fn()})

    void render(
      <RequestHarness
        variantCreationRef={variantCreationRef}
        variantId={SUMMER_SALE._id}
        onClose={onClose}
      />,
    )
    await expect.element($create).toHaveFocus()
    await userEvent.click(page.getByTestId('create-variant-cancel'))

    await expect.element(page.getByTestId('inventory-header')).toBeVisible()
    await expect.poll(() => onClose.mock.calls.length).toBe(1)
  })

  it('answers the request when Escape closes the form', async () => {
    const onClose = vi.fn()
    const variantCreationRef = startCreation({createVariant: vi.fn()})

    void render(
      <RequestHarness
        variantCreationRef={variantCreationRef}
        variantId={SUMMER_SALE._id}
        onClose={onClose}
      />,
    )
    await expect.element($create).toHaveFocus()
    await userEvent.keyboard('{Escape}')

    await expect.element(page.getByTestId('inventory-header')).toBeVisible()
    await expect.poll(() => onClose.mock.calls.length).toBe(1)
  })

  it('answers straight away when variants cannot be created', async () => {
    const onClose = vi.fn()
    const variantCreationRef = startCreation({enabled: false, createVariant: vi.fn()})

    void render(
      <RequestHarness
        variantCreationRef={variantCreationRef}
        variantId={SUMMER_SALE._id}
        onClose={onClose}
      />,
    )

    await expect.element(page.getByTestId('inventory-header')).toBeVisible()
    await expect.poll(() => onClose.mock.calls.length).toBe(1)
  })

  it('leaves the form closed without a request', async () => {
    const onClose = vi.fn()
    const variantCreationRef = startCreation({createVariant: vi.fn()})

    void render(
      <RequestHarness
        variantCreationRef={variantCreationRef}
        variantId={undefined}
        onClose={onClose}
      />,
    )

    await expect.element(page.getByTestId('inventory-header')).toBeVisible()
    expect(variantCreationRef.getSnapshot().matches('idle')).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
  })
})
