import {render, screen, waitFor} from '@testing-library/react'
import {Activity} from 'react'
import {defer, NEVER, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {useProjectStore} from '../../../store/datastores'
import {type ProjectGrants, type ProjectStore} from '../../../store/project/types'
import {useCanInviteProjectMembers} from './useCanInviteMembers'

vi.mock('../../../store/datastores', () => ({useProjectStore: vi.fn()}))

const grants: ProjectGrants = {
  'sanity.project.members': [
    {
      id: 'administrator',
      name: 'administrator',
      title: 'Administrator',
      description: null,
      isCustom: false,
      config: {},
      grants: [{name: 'invite', params: {}}],
    },
  ],
}

/**
 * Mocks the project store, counting how many times the grants request is
 * actually subscribed to. The other store methods never emit — this hook only
 * reads grants.
 */
function mockGrantsRequest() {
  const subscribes = {count: 0}
  const projectStore: ProjectStore = {
    get: () => NEVER,
    getDatasets: () => NEVER,
    getProjectName: () => NEVER,
    getOrganizationData: () => NEVER,
    getOrganizationId: () => NEVER,
    getGrants: vi.fn(() =>
      defer(() => {
        subscribes.count += 1
        return of(grants)
      }),
    ),
  }
  vi.mocked(useProjectStore).mockReturnValue(projectStore)
  return subscribes
}

describe('useCanInviteProjectMembers', () => {
  it('defers the grants request while hidden, even across re-renders', async () => {
    const subscribes = mockGrantsRequest()

    function CanInvite() {
      return <span data-testid="can-invite">{String(useCanInviteProjectMembers())}</span>
    }
    const view = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <CanInvite />
      </Activity>
    )

    // Mount hidden — a closed menu keeps its content mounted.
    const {rerender} = render(view('hidden'))
    expect(await screen.findByTestId('can-invite')).toBeInTheDocument()

    // Re-render while still hidden: no subscription, no request.
    rerender(view('hidden'))
    rerender(view('hidden'))
    expect(subscribes.count).toBe(0)

    // Reveal → subscribe once → value resolves.
    rerender(view('visible'))
    await waitFor(() => expect(screen.getByTestId('can-invite')).toHaveTextContent('true'))
    expect(subscribes.count).toBe(1)

    // Re-render while visible: still exactly one subscription.
    // The stable observable identity is load-bearing — react-rx re-warms
    // *replacement* observables during render, so identity churn would add
    // a subscription on every re-render here.
    rerender(view('visible'))
    rerender(view('visible'))
    expect(subscribes.count).toBe(1)
  })

  it('does not subscribe while disabled, then subscribes once when enabled', async () => {
    const subscribes = mockGrantsRequest()

    function CanInvite({enabled}: {enabled: boolean}) {
      return <span data-testid="can-invite">{String(useCanInviteProjectMembers({enabled}))}</span>
    }

    const {rerender} = render(<CanInvite enabled={false} />)
    expect(screen.getByTestId('can-invite')).toHaveTextContent('false')
    rerender(<CanInvite enabled={false} />)
    expect(subscribes.count).toBe(0)

    rerender(<CanInvite enabled={true} />)
    await waitFor(() => expect(screen.getByTestId('can-invite')).toHaveTextContent('true'))
    expect(subscribes.count).toBe(1)

    // `disabled` keeps the last emission, but the hook's contract is: if we
    // are not checking grants, assume no access.
    rerender(<CanInvite enabled={false} />)
    expect(screen.getByTestId('can-invite')).toHaveTextContent('false')
    expect(subscribes.count).toBe(1)
  })
})
