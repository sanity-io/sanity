import {render, waitFor} from '@testing-library/react'
import {type ComponentType, type PropsWithChildren, type ReactNode, useEffect} from 'react'
import {FormFieldPresenceContext} from 'sanity/_singletons'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {DEFAULT_MAX_AVATARS_FIELDS} from '../constants'
import {FieldPresence} from '../FieldPresence'
import {
  PresenceTracker,
  type ReportedPresenceData,
  usePresenceReportedValues,
} from '../overlay/tracker'
import {type FormNodePresence} from '../types'

vi.mock('../../components/userAvatar/UserAvatar', () => ({
  UserAvatar: (props: {user: {id: string; displayName?: string}}) => (
    <span data-testid="user-avatar" title={props.user.displayName} />
  ),
}))

function presence(userId: string, path: FormNodePresence['path'] = ['title']): FormNodePresence {
  return {
    user: {id: userId, displayName: `User ${userId}`},
    path,
    sessionId: `session-${userId}`,
    lastActiveAt: '2026-01-01T00:00:00.000Z',
  }
}

type Reported = {current: ReportedPresenceData[]}

/** Exposes what the reporters inside the surrounding `PresenceTracker` reported */
function ReportedValuesProbe({onReported}: {onReported: (values: ReportedPresenceData[]) => void}) {
  const values = usePresenceReportedValues()
  useEffect(() => {
    onReported(values)
  }, [onReported, values])
  return null
}

let TestProvider: ComponentType<PropsWithChildren>

beforeAll(async () => {
  TestProvider = await createTestProvider()
})

function Harness({
  children,
  onReported,
}: {
  children?: ReactNode
  onReported: (values: ReportedPresenceData[]) => void
}) {
  return (
    <TestProvider>
      <PresenceTracker>
        <ReportedValuesProbe onReported={onReported} />
        {children}
      </PresenceTracker>
    </TestProvider>
  )
}

function renderWithTracker(ui: ReactNode) {
  const reported: Reported = {current: []}
  const onReported = (values: ReportedPresenceData[]) => {
    reported.current = values
  }
  const result = render(<Harness onReported={onReported}>{ui}</Harness>)
  const rerenderWithTracker = (nextUi: ReactNode) =>
    result.rerender(<Harness onReported={onReported}>{nextUi}</Harness>)
  return {...result, reported, rerenderWithTracker}
}

describe('FieldPresence', () => {
  it('renders a placeholder and reports it with the presence and max avatars to the tracker', async () => {
    const items = [presence('u1'), presence('u2')]
    const {container, reported} = renderWithTracker(
      <FieldPresence presence={items} maxAvatars={4} />,
    )

    await waitFor(() => expect(reported.current).toHaveLength(1))

    const [[, region]] = reported.current
    expect(region.presence).toBe(items)
    expect(region.maxAvatars).toBe(4)
    expect(region.element).toBeInstanceOf(HTMLElement)
    expect(container).toContainElement(region.element)
    // The placeholder reserves the avatar's footprint; the avatars themselves are drawn by the
    // presence overlay, not by the field.
    expect(region.element).toHaveStyle({minHeight: '25px', minWidth: '25px'})
  })

  it('falls back to the presence from context when no presence prop is given', async () => {
    const items = [presence('u1')]
    const {reported} = renderWithTracker(
      <FormFieldPresenceContext.Provider value={items}>
        <FieldPresence presence={undefined as unknown as FormNodePresence[]} maxAvatars={3} />
      </FormFieldPresenceContext.Provider>,
    )

    await waitFor(() => expect(reported.current).toHaveLength(1))
    expect(reported.current[0][1].presence).toBe(items)
  })

  it('defaults max avatars to the field default', async () => {
    const {reported} = renderWithTracker(
      <FieldPresence presence={[presence('u1')]} maxAvatars={undefined as unknown as number} />,
    )

    await waitFor(() => expect(reported.current).toHaveLength(1))
    expect(reported.current[0][1].maxAvatars).toBe(DEFAULT_MAX_AVATARS_FIELDS)
  })

  it('reports updated presence under the same region id', async () => {
    const first = [presence('u1')]
    const {reported, rerenderWithTracker} = renderWithTracker(
      <FieldPresence presence={first} maxAvatars={3} />,
    )
    await waitFor(() => expect(reported.current).toHaveLength(1))
    const [id] = reported.current[0]

    const second = [presence('u1'), presence('u2')]
    rerenderWithTracker(<FieldPresence presence={second} maxAvatars={3} />)

    await waitFor(() => expect(reported.current[0][1].presence).toBe(second))
    expect(reported.current).toHaveLength(1)
    expect(reported.current[0][0]).toBe(id)
  })

  it('removes its region from the tracker when unmounted', async () => {
    const {reported, rerenderWithTracker} = renderWithTracker(
      <FieldPresence presence={[presence('u1')]} maxAvatars={3} />,
    )
    await waitFor(() => expect(reported.current).toHaveLength(1))

    rerenderWithTracker(null)

    await waitFor(() => expect(reported.current).toHaveLength(0))
  })

  it('registers a separate region for every instance', async () => {
    const {reported} = renderWithTracker(
      <>
        <FieldPresence presence={[presence('u1', ['title'])]} maxAvatars={3} />
        <FieldPresence presence={[presence('u2', ['subtitle'])]} maxAvatars={3} />
      </>,
    )

    await waitFor(() => expect(reported.current).toHaveLength(2))
    const [[idA, regionA], [idB, regionB]] = reported.current
    expect(idA).not.toBe(idB)
    expect(regionA.element).not.toBe(regionB.element)
    expect(regionA.presence[0].user.id).toBe('u1')
    expect(regionB.presence[0].user.id).toBe('u2')
  })
})
