import {type Path} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {useContext} from 'react'
import {FormFieldPresenceContext} from 'sanity/_singletons'
import {describe, expect, it} from 'vitest'

import {PresenceScope} from '../PresenceScope'
import {type FormNodePresence} from '../types'

function presence(userId: string, path: Path): FormNodePresence {
  return {
    user: {id: userId, displayName: `User ${userId}`},
    path,
    sessionId: `session-${userId}`,
    lastActiveAt: '2026-01-01T00:00:00.000Z',
  }
}

const ALL_PRESENCE: FormNodePresence[] = [
  presence('root', []),
  presence('title', ['title']),
  presence('author-name', ['author', 'name']),
  presence('author', ['author']),
  presence('item-title', ['items', {_key: 'a'}, 'title']),
]

/** Renders the scoped presence from context so the test can read it back */
function Probe() {
  const scopedPresence = useContext(FormFieldPresenceContext)
  return <pre data-testid="probe">{JSON.stringify(scopedPresence)}</pre>
}

function scoped(path: Path, readOnly?: boolean): FormNodePresence[] {
  const {unmount} = render(
    <FormFieldPresenceContext.Provider value={ALL_PRESENCE}>
      <PresenceScope path={path} readOnly={readOnly}>
        <Probe />
      </PresenceScope>
    </FormFieldPresenceContext.Provider>,
  )
  const result = JSON.parse(screen.getByTestId('probe').textContent || '[]')
  unmount()
  return result
}

describe('PresenceScope', () => {
  it('keeps presence at and below the scope path, with the scope path trimmed off', () => {
    expect(scoped(['author'])).toEqual([
      {...presence('author-name', ['author', 'name']), path: ['name']},
      {...presence('author', ['author']), path: []},
    ])
  })

  it('handles keyed array item paths', () => {
    expect(scoped(['items', {_key: 'a'}])).toEqual([
      {...presence('item-title', ['items', {_key: 'a'}, 'title']), path: ['title']},
    ])
  })

  it('drops presence outside the scope, including document-level presence', () => {
    expect(scoped(['title'])).toEqual([{...presence('title', ['title']), path: []}])
    expect(scoped(['missing'])).toEqual([])
  })

  it('exposes no presence for read-only scopes', () => {
    expect(scoped(['author'], true)).toEqual([])
  })
})
