import {type SanityClient} from '@sanity/client'
import {defineField, defineType, type Path} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {type ComponentType, type PropsWithChildren, useEffect, useMemo, useState} from 'react'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {DEFAULT_MAX_AVATARS_FIELDS} from '../../../presence/constants'
import {
  PresenceTracker,
  type ReportedPresenceData,
  usePresenceReportedValues,
} from '../../../presence/overlay/tracker'
import {type FormNodePresence} from '../../../presence/types'
import {useWorkspace} from '../../../studio/workspace'
import {EMPTY_ARRAY} from '../../../util/empty'
import {createPatchChannel} from '../../patch/PatchChannel'
import {useFormState} from '../../store/useFormState'
import {type FormDocumentValue} from '../../types/formDocumentValue'
import {FormBuilder, type FormBuilderProps} from '../FormBuilder'
import {useEnhancedObjectDialog} from '../tree-editing/context/enabled/useEnhancedObjectDialog'

/**
 * Integration of the form with the presence tracker: the form state routes presence to the exact
 * field it belongs to, the field header renders a `FieldPresence` placeholder for it, and that
 * placeholder registers with the surrounding tracker. This is what the presence overlay draws
 * from, so it is asserted here through what gets reported to the tracker.
 */

vi.mock('../tree-editing/context/enabled/useEnhancedObjectDialog', () => ({
  useEnhancedObjectDialog: vi.fn(() => ({enabled: false})),
}))

const FIELD_COUNT = 10

const schemaTypes = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      ...Array.from({length: FIELD_COUNT}, (_, i) =>
        defineField({type: 'string', name: `field${i}`, title: `Field ${i}`}),
      ),
      defineField({type: 'string', name: 'secret', title: 'Secret', hidden: true}),
      defineField({
        type: 'object',
        name: 'author',
        title: 'Author',
        fields: [
          defineField({type: 'string', name: 'name', title: 'Name'}),
          defineField({type: 'string', name: 'bio', title: 'Bio'}),
        ],
      }),
    ],
  }),
]

const DOCUMENT: FormDocumentValue = {
  _id: 'doc-1',
  _type: 'test',
  author: {name: 'Nancy', bio: ''},
} as FormDocumentValue

function presence(userId: string, path: Path): FormNodePresence {
  return {
    user: {id: userId, displayName: `User ${userId}`},
    path,
    sessionId: `session-${userId}`,
    lastActiveAt: '2026-01-01T00:00:00.000Z',
  }
}

function noop() {
  return undefined
}

type Reported = {current: ReportedPresenceData[]}
type OnReported = (values: ReportedPresenceData[]) => void

/** Exposes what the field placeholders inside the surrounding `PresenceTracker` reported */
function ReportedValuesProbe({onReported}: {onReported: OnReported}) {
  const values = usePresenceReportedValues()
  useEffect(() => {
    onReported(values)
  }, [onReported, values])
  return null
}

function FormBuilderHarness({presence: presenceProp}: {presence: FormNodePresence[]}) {
  const {schema} = useWorkspace()
  const schemaType = schema.get('test')

  if (!schemaType || schemaType.jsonType !== 'object') {
    throw new Error('missing object schema type')
  }

  const [patchChannel] = useState(() => createPatchChannel())

  // @ts-expect-error -- same partial options as FormBuilder.test.tsx
  const formState = useFormState({
    schemaType,
    documentValue: DOCUMENT,
    comparisonValue: DOCUMENT,
    focusPath: EMPTY_ARRAY,
    collapsedPaths: undefined,
    collapsedFieldSets: undefined,
    fieldGroupState: undefined,
    openPath: EMPTY_ARRAY,
    presence: presenceProp,
    validation: [],
  })

  // @ts-expect-error -- same partial props as FormBuilder.test.tsx
  const formBuilderProps: FormBuilderProps = useMemo(
    () => ({
      __internal_patchChannel: patchChannel,
      changesOpen: false,
      changed: false,
      collapsedFieldSets: undefined,
      collapsedPaths: undefined,
      focused: formState?.focused,
      focusPath: formState?.focusPath || EMPTY_ARRAY,
      groups: formState?.groups || EMPTY_ARRAY,
      id: 'root',
      level: formState?.level || 0,
      members: formState?.members || EMPTY_ARRAY,
      onChange: noop,
      onFieldGroupSelect: noop,
      onPathBlur: noop,
      onPathFocus: noop,
      onPathOpen: noop,
      onSelectFieldGroup: noop,
      onSetFieldSetCollapsed: noop,
      onSetPathCollapsed: noop,
      path: EMPTY_ARRAY,
      presence: presenceProp,
      schemaType: formState?.schemaType || schemaType,
      validation: EMPTY_ARRAY,
      value: formState?.value as FormDocumentValue,
    }),
    [formState, patchChannel, presenceProp, schemaType],
  )

  return <FormBuilder {...formBuilderProps} />
}

let TestProvider: ComponentType<PropsWithChildren>

beforeAll(async () => {
  const client = createMockSanityClient() as unknown as SanityClient
  TestProvider = await createTestProvider({
    client,
    config: {name: 'default', projectId: 'test', dataset: 'test', schema: {types: schemaTypes}},
  })
})

function Harness({
  presence: presenceProp,
  onReported,
}: {
  presence: FormNodePresence[]
  onReported: OnReported
}) {
  return (
    <TestProvider>
      <PresenceTracker>
        <ReportedValuesProbe onReported={onReported} />
        <FormBuilderHarness presence={presenceProp} />
      </PresenceTracker>
    </TestProvider>
  )
}

async function renderForm(presenceProp: FormNodePresence[]) {
  const reported: Reported = {current: []}
  const onReported: OnReported = (values) => {
    reported.current = values
  }
  const view = render(<Harness presence={presenceProp} onReported={onReported} />)
  await screen.findByTestId('field-field0')
  return {
    reported,
    rerenderForm: (next: FormNodePresence[]) =>
      view.rerender(<Harness presence={next} onReported={onReported} />),
  }
}

const regions = (reported: Reported) => reported.current.map(([, region]) => region)

/** The field (by test id) that a reported region's placeholder element lives in */
function fieldOf(region: ReportedPresenceData[1]) {
  return region.element?.closest('[data-testid^="field-"]')?.getAttribute('data-testid')
}

describe('FormBuilder presence', () => {
  it('reports nothing when no one is in the document', async () => {
    const {reported} = await renderForm([])

    // Give the tracker's debounced publish a chance to run
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(reported.current).toEqual([])
  })

  it('reports 10 users in the same field as one region with all of them', async () => {
    const users = Array.from({length: 10}, (_, i) => presence(`user-${i}`, ['field3']))
    const {reported} = await renderForm(users)

    await waitFor(() => expect(reported.current).toHaveLength(1))
    const [region] = regions(reported)
    expect(region.presence).toHaveLength(10)
    expect(region.presence.map((p) => p.user.id)).toEqual(users.map((p) => p.user.id))
    expect(region.maxAvatars).toBe(4)
    expect(fieldOf(region)).toBe('field-field3')
  })

  it('reports 10 users in 10 different fields as 10 regions, each in its own field', async () => {
    const users = Array.from({length: 10}, (_, i) => presence(`user-${i}`, [`field${i}`]))
    const {reported} = await renderForm(users)

    await waitFor(() => expect(reported.current).toHaveLength(10))
    const byField = new Map(regions(reported).map((region) => [fieldOf(region), region]))
    for (let i = 0; i < FIELD_COUNT; i++) {
      const region = byField.get(`field-field${i}`)
      expect(region?.presence.map((p) => p.user.id)).toEqual([`user-${i}`])
    }
  })

  it('reports presence on a nested object field at the nested field, not the parent', async () => {
    const {reported} = await renderForm([presence('alice', ['author', 'name'])])

    await waitFor(() => expect(reported.current).toHaveLength(1))
    const [region] = regions(reported)
    expect(fieldOf(region)).toBe('field-author.name')
    expect(region.presence[0].path).toEqual(['author', 'name'])
  })

  it('reports presence on the object itself at the object field', async () => {
    const {reported} = await renderForm([presence('alice', ['author'])])

    await waitFor(() => expect(reported.current).toHaveLength(1))
    expect(fieldOf(regions(reported)[0])).toBe('field-author')
  })

  // Presence inside array items is covered by the browser suite (PresenceOverlay.browser.test):
  // the virtualized array list does not render its items in jsdom.

  it('reports nothing for document-level presence', async () => {
    const {reported} = await renderForm([presence('alice', [])])

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(reported.current).toEqual([])
  })

  it('reports nothing for presence on a hidden field', async () => {
    const {reported} = await renderForm([presence('alice', ['secret'])])

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(reported.current).toEqual([])
  })

  it('reports nothing for presence on a field that does not exist', async () => {
    const {reported} = await renderForm([presence('alice', ['nope'])])

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(reported.current).toEqual([])
  })

  it('follows presence as users leave, arrive and move between fields', async () => {
    const {reported, rerenderForm} = await renderForm([presence('alice', ['field0'])])
    await waitFor(() => expect(regions(reported).map(fieldOf)).toEqual(['field-field0']))

    // Alice moves to another field and Bob arrives
    rerenderForm([presence('alice', ['field5']), presence('bob', ['field7'])])
    await waitFor(() =>
      expect(
        regions(reported)
          .map((region) => fieldOf(region) ?? '')
          .toSorted((a, b) => a.localeCompare(b)),
      ).toEqual(['field-field5', 'field-field7']),
    )

    // Everyone leaves
    rerenderForm([])
    await waitFor(() => expect(reported.current).toEqual([]))
  })

  it('uses the default maximum of avatars nowhere in the field headers', async () => {
    // Field headers stack up to 4 avatars, which differs from the overlay default of 3
    const {reported} = await renderForm([presence('alice', ['field0'])])

    await waitFor(() => expect(reported.current).toHaveLength(1))
    expect(regions(reported)[0].maxAvatars).not.toBe(DEFAULT_MAX_AVATARS_FIELDS)
    expect(regions(reported)[0].maxAvatars).toBe(4)
  })
})
