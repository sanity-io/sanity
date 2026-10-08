import {type User} from '@sanity/types'
import {act, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useUserStore} from '../../../store/datastores'
import {type UserStore} from '../../../store/user/userStore'
import {ColorSchemeProvider} from '../../../studio/colorScheme'
import {UserColorManagerProvider} from '../../../user-color/provider'
import {UserAvatar} from '../UserAvatar'

vi.mock('../../../store/datastores', () => ({useUserStore: vi.fn()}))

const SKELETON = '[data-ui="Skeleton"]'
const AVATAR = '[data-ui="Avatar"]'

const ada: User = {id: 'pAda', displayName: 'Ada Lovelace'}
const grace: User = {id: 'pGrace', displayName: 'Grace Hopper'}

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
})
