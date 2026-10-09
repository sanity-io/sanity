import {type CurrentUser, type User} from '@sanity/types'
import {act, fireEvent, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {DEFAULT_HOOK_TTL} from 'react-rx'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useUserStore} from '../../../store/datastores'
import {useCurrentUser} from '../../../store/user/hooks'
import {type UserStore} from '../../../store/user/userStore'
import {ColorSchemeProvider} from '../../../studio/colorScheme'
import {UserColorManagerProvider} from '../../../user-color/provider'
import {UserAvatar} from '../UserAvatar'

vi.mock('../../../store/datastores', () => ({useUserStore: vi.fn()}))
vi.mock('../../../store/user/hooks', () => ({useCurrentUser: vi.fn()}))

const SKELETON = '[data-ui="Skeleton"]'
const AVATAR = '[data-ui="Avatar"]'

const ada: User = {id: 'pAda', displayName: 'Ada Lovelace'}
const grace: User = {id: 'pGrace', displayName: 'Grace Hopper'}
const signedIn: CurrentUser = {
  id: 'pMe',
  name: 'Margaret Hamilton',
  email: 'margaret@example.com',
  // oxlint-disable-next-line no-deprecated -- `CurrentUser` still requires the deprecated field
  role: 'administrator',
  roles: [],
}

function mockGetUser(getUser: UserStore['getUser']) {
  const userStore = {getUser: vi.fn(getUser), getUsers: vi.fn()}
  vi.mocked(useUserStore).mockReturnValue(userStore)
  return userStore.getUser
}

function wrapper({children}: {children: ReactNode}) {
  return (
    <ColorSchemeProvider scheme="light">
      <UserColorManagerProvider>{children}</UserColorManagerProvider>
    </ColorSchemeProvider>
  )
}

/**
 * An avatar given a user id suspends until the user loads, and React only resumes work that
 * suspended inside an awaited `act`.
 */
async function renderAvatar(ui: ReactNode) {
  let result!: ReturnType<typeof render>
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- see doc comment
  await act(async () => {
    result = render(ui, {wrapper})
  })
  return result
}

/** The skeletons inserted while `run` is pending, including ones a later commit replaced. */
async function collectInsertedSkeletons(run: () => Promise<unknown>): Promise<Element[]> {
  const inserted: Element[] = []
  const collect = (records: MutationRecord[]) => {
    for (const node of records.flatMap((record) => [...record.addedNodes])) {
      if (node instanceof Element) {
        inserted.push(...(node.matches(SKELETON) ? [node] : []), ...node.querySelectorAll(SKELETON))
      }
    }
  }
  const observer = new MutationObserver(collect)
  observer.observe(document.body, {childList: true, subtree: true})
  try {
    await run()
    collect(observer.takeRecords())
  } finally {
    observer.disconnect()
  }
  return inserted
}

beforeEach(() => {
  vi.mocked(useCurrentUser).mockReturnValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('UserAvatar', () => {
  it('shows a skeleton while the user loads, then the avatar', async () => {
    let resolveUser!: (user: User | null) => void
    mockGetUser(
      () =>
        new Promise((resolve) => {
          resolveUser = resolve
        }),
    )

    const {container} = await renderAvatar(<UserAvatar user={ada.id} />)

    expect(container.querySelector(SKELETON)).toBeInTheDocument()
    expect(screen.queryByLabelText('Ada Lovelace')).not.toBeInTheDocument()

    await act(async () => {
      resolveUser(ada)
    })

    expect(screen.getByLabelText('Ada Lovelace')).toHaveTextContent('AL')
    expect(container.querySelector(SKELETON)).not.toBeInTheDocument()
  })

  it('keeps showing a skeleton when the user cannot be found', async () => {
    mockGetUser(async () => null)

    const {container} = await renderAvatar(<UserAvatar user="pMissing" />)

    expect(container.querySelector(SKELETON)).toBeInTheDocument()
    expect(container.querySelector(AVATAR)).not.toBeInTheDocument()
  })

  it('logs a failed lookup, keeps showing a skeleton, and retries it on the next mount', async () => {
    const error = new Error('Network request failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const getUser = mockGetUser(
      vi.fn<UserStore['getUser']>().mockRejectedValueOnce(error).mockResolvedValueOnce(ada),
    )

    const {container, unmount} = await renderAvatar(<UserAvatar user={ada.id} />)

    expect(consoleError).toHaveBeenCalledWith(error)
    expect(container.querySelector(SKELETON)).toBeInTheDocument()
    expect(container.querySelector(AVATAR)).not.toBeInTheDocument()

    unmount()
    await renderAvatar(<UserAvatar user={ada.id} />)

    expect(screen.getByLabelText('Ada Lovelace')).toBeInTheDocument()
    expect(getUser).toHaveBeenCalledTimes(2)
  })

  it('renders an already loaded user without a loading state, from a single lookup', async () => {
    const getUser = mockGetUser(async () => ada)
    await renderAvatar(<UserAvatar user={ada.id} />)

    const insertedSkeletons = await collectInsertedSkeletons(() =>
      renderAvatar(<UserAvatar user={ada.id} size={2} />),
    )

    expect(insertedSkeletons).toHaveLength(0)
    expect(screen.getAllByLabelText('Ada Lovelace')).toHaveLength(2)
    expect(getUser).toHaveBeenCalledTimes(1)
  })

  it('renders a loaded user without a loading state after every avatar for it unmounted', async () => {
    const getUser = mockGetUser(async () => ada)
    const {unmount} = await renderAvatar(<UserAvatar user={ada.id} />)

    vi.useFakeTimers()
    try {
      unmount()
      // Past the time react-rx keeps a settled promise without subscribers by default
      vi.advanceTimersByTime(DEFAULT_HOOK_TTL + 1)
    } finally {
      vi.useRealTimers()
    }
    const insertedSkeletons = await collectInsertedSkeletons(() =>
      renderAvatar(<UserAvatar user={ada.id} />),
    )

    expect(insertedSkeletons).toHaveLength(0)
    expect(screen.getByLabelText('Ada Lovelace')).toBeInTheDocument()
    expect(getUser).toHaveBeenCalledTimes(1)
  })

  it("shows the next user's image after the previous user's image failed to load", () => {
    const {container, rerender} = render(
      <UserAvatar user={{...ada, imageUrl: 'https://images.test/ada.png'}} />,
      {wrapper},
    )

    fireEvent.error(container.querySelector('img')!)
    expect(screen.getByLabelText('Ada Lovelace')).toHaveTextContent('AL')

    rerender(<UserAvatar user={{...grace, imageUrl: 'https://images.test/grace.png'}} />)

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://images.test/grace.png')
  })

  it('switches to the new user when the user id changes', async () => {
    mockGetUser(async (userId) => (userId === grace.id ? grace : ada))
    const {rerender} = await renderAvatar(<UserAvatar user={ada.id} />)

    expect(screen.getByLabelText('Ada Lovelace')).toBeInTheDocument()

    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the avatar suspends on the new user, and React only resumes work that suspended inside an awaited `act`
    await act(async () => {
      rerender(<UserAvatar user={grace.id} />)
    })

    expect(screen.getByLabelText('Grace Hopper')).toHaveTextContent('GH')
    expect(screen.queryByLabelText('Ada Lovelace')).not.toBeInTheDocument()
  })

  describe('for the signed-in user', () => {
    beforeEach(() => {
      vi.mocked(useCurrentUser).mockReturnValue(signedIn)
    })

    it('renders `me` from the current user in the first render, without a lookup', () => {
      const getUser = mockGetUser(vi.fn())

      // A plain render: nothing suspends, so no act() is needed for a skeleton to resolve
      const {container} = render(<UserAvatar user="me" />, {wrapper})

      expect(screen.getByLabelText('Margaret Hamilton')).toHaveTextContent('MH')
      expect(container.querySelector(SKELETON)).not.toBeInTheDocument()
      expect(getUser).not.toHaveBeenCalled()
    })

    it('renders the current user by id the same way', () => {
      const getUser = mockGetUser(vi.fn())

      render(<UserAvatar user={signedIn.id} />, {wrapper})

      expect(screen.getByLabelText('Margaret Hamilton')).toBeInTheDocument()
      expect(getUser).not.toHaveBeenCalled()
    })

    it('still looks other users up', async () => {
      const getUser = mockGetUser(async () => ada)

      await renderAvatar(<UserAvatar user={ada.id} />)

      expect(screen.getByLabelText('Ada Lovelace')).toBeInTheDocument()
      expect(getUser).toHaveBeenCalledWith(ada.id)
    })
  })
})
