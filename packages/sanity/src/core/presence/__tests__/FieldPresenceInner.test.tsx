import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {DEFAULT_MAX_AVATARS_FIELDS, MAX_AVATARS_DOCK} from '../constants'
import {FieldPresenceInner} from '../FieldPresence'
import {type FormNodePresence} from '../types'

vi.mock('../../components/userAvatar/UserAvatar', () => ({
  UserAvatar: (props: {
    user: {id: string; displayName?: string}
    position?: string
    animateArrowFrom?: string
    status?: string
  }) => (
    <span
      data-testid="user-avatar"
      data-user-id={props.user.id}
      data-position={props.position}
      data-animate-arrow-from={props.animateArrowFrom}
      data-status={props.status}
      title={props.user.displayName}
    />
  ),
}))

function presence(
  userId: string,
  overrides: Partial<Omit<FormNodePresence, 'user'>> = {},
): FormNodePresence {
  return {
    user: {id: userId, displayName: `User ${userId}`},
    path: ['title'],
    sessionId: `session-${userId}`,
    lastActiveAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const users = (count: number) => Array.from({length: count}, (_, i) => presence(`u${i + 1}`))

function Wrapper({children}: {children: ReactNode}) {
  // oxlint-disable-next-line no-deprecated -- studioTheme is what the studio renders with
  return <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
}

const renderInner = (ui: ReactNode) => render(ui, {wrapper: Wrapper})

const avatars = () => screen.queryAllByTestId('user-avatar')
const avatarUserIds = () => avatars().map((el) => el.getAttribute('data-user-id'))
const counter = () => document.querySelector('[data-ui="AvatarCounter"]')

describe('FieldPresenceInner', () => {
  it('renders nothing for empty presence', () => {
    renderInner(<FieldPresenceInner presence={[]} />)

    expect(avatars()).toHaveLength(0)
    expect(counter()).toBeNull()
  })

  it('renders one avatar per user', () => {
    renderInner(<FieldPresenceInner presence={users(2)} />)

    expect(avatarUserIds()).toEqual(expect.arrayContaining(['u1', 'u2']))
    expect(avatars()).toHaveLength(2)
    expect(counter()).toBeNull()
  })

  it('shows a user with several sessions only once', () => {
    renderInner(
      <FieldPresenceInner
        presence={[
          presence('u1', {sessionId: 'session-a'}),
          presence('u1', {sessionId: 'session-b'}),
          presence('u2'),
        ]}
      />,
    )

    expect(avatars()).toHaveLength(2)
    expect(avatarUserIds()).toEqual(expect.arrayContaining(['u1', 'u2']))
  })

  it('puts the most recently active user first', () => {
    renderInner(
      <FieldPresenceInner
        presence={[
          presence('older', {lastActiveAt: '2026-01-01T00:00:00.000Z'}),
          presence('newest', {lastActiveAt: '2026-01-03T00:00:00.000Z'}),
          presence('middle', {lastActiveAt: '2026-01-02T00:00:00.000Z'}),
        ]}
      />,
    )

    expect(avatarUserIds()).toEqual(['newest', 'middle', 'older'])
  })

  it('stacks 10 users into 2 avatars and a counter of 8 at the dock maximum', () => {
    renderInner(<FieldPresenceInner presence={users(10)} maxAvatars={MAX_AVATARS_DOCK} />)

    expect(avatars()).toHaveLength(2)
    expect(counter()).toHaveTextContent('8')
  })

  it('stacks 10 users into 2 avatars and a counter of 8 at the default field maximum', () => {
    renderInner(<FieldPresenceInner presence={users(10)} />)

    expect(DEFAULT_MAX_AVATARS_FIELDS).toBe(3)
    expect(avatars()).toHaveLength(2)
    expect(counter()).toHaveTextContent('8')
  })

  it('stacks 10 users into 3 avatars and a counter of 7 with a maximum of 4', () => {
    renderInner(<FieldPresenceInner presence={users(10)} maxAvatars={4} />)

    expect(avatars()).toHaveLength(3)
    expect(counter()).toHaveTextContent('7')
  })

  it('shows all avatars without a counter when the maximum is not exceeded', () => {
    renderInner(<FieldPresenceInner presence={users(3)} maxAvatars={3} />)

    expect(avatars()).toHaveLength(3)
    expect(counter()).toBeNull()
  })

  it('does not stack when stacking is disabled', () => {
    renderInner(<FieldPresenceInner presence={users(10)} maxAvatars={3} stack={false} />)

    expect(avatars()).toHaveLength(10)
    expect(counter()).toBeNull()
  })

  it('uses the last slot for the counter as soon as the maximum is exceeded', () => {
    // One more user than the maximum: the counter takes a slot, so it always counts at least 2
    renderInner(<FieldPresenceInner presence={users(4)} maxAvatars={3} />)

    expect(avatars()).toHaveLength(2)
    expect(counter()).toHaveTextContent('2')
  })

  it('passes the arrow position on to the avatars', () => {
    renderInner(<FieldPresenceInner presence={users(1)} position="top" animateArrowFrom="bottom" />)

    const [avatar] = avatars()
    expect(avatar).toHaveAttribute('data-position', 'top')
    expect(avatar).toHaveAttribute('data-animate-arrow-from', 'bottom')
    expect(avatar).toHaveAttribute('data-status', 'online')
  })

  it('defaults the arrow position to inside', () => {
    renderInner(<FieldPresenceInner presence={users(1)} />)

    expect(avatars()[0]).toHaveAttribute('data-position', 'inside')
  })
})
