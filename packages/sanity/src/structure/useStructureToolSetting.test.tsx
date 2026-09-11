import {render} from '@testing-library/react'
import {merge, NEVER, of} from 'rxjs'
import {beforeEach, expect, it, vi} from 'vitest'

import {useStructureToolSetting} from './useStructureToolSetting'

// Like the SWR-wrapped key-value store: the locally cached value (or `null`) arrives synchronously
// on subscribe, and the stream then stays open for the server.
const stored = new Map<string, string>()
const setKey = vi.fn(async (key: string, value: unknown) => {
  stored.set(key, value as string)
})
// Stable like the real store (it comes from the resource cache): a fresh object per render would
// rebuild `value$` on every render.
const keyValueStore = {
  getKey: (key: string) => merge(of(stored.get(key) ?? null), NEVER),
  setKey,
}
vi.mock('sanity', () => ({
  useKeyValueStore: () => keyValueStore,
}))

interface Frame {
  key: string
  value: string | undefined
}

function Consumer({
  settingKey,
  defaultValue,
  frames,
}: {
  settingKey: string
  defaultValue: string
  frames: Frame[]
}) {
  const [value] = useStructureToolSetting<string>('layout', settingKey, defaultValue)
  frames.push({key: settingKey, value})
  return null
}

beforeEach(() => {
  stored.clear()
  setKey.mockClear()
})

it('renders only the current key’s setting when the key and its default change', () => {
  stored.set('studio.structure-tool.layout.author', 'detail')
  stored.set('studio.structure-tool.layout.book', 'compact')
  const frames: Frame[] = []
  const {rerender} = render(<Consumer settingKey="author" defaultValue="default" frames={frames} />)
  expect(frames.at(-1)).toEqual({key: 'author', value: 'detail'})

  rerender(<Consumer settingKey="book" defaultValue="media" frames={frames} />)

  // no render of the new key shows the previous key's setting, nor the default it mounted with
  const bookFrames = frames.filter((frame) => frame.key === 'book').map((frame) => frame.value)
  expect(bookFrames).not.toContain('detail')
  expect(bookFrames).not.toContain('default')
  expect(bookFrames.at(-1)).toBe('compact')
})

it('renders the current default while a key without a stored setting loads', () => {
  stored.set('studio.structure-tool.layout.author', 'detail')
  const frames: Frame[] = []
  const {rerender} = render(<Consumer settingKey="author" defaultValue="default" frames={frames} />)

  rerender(<Consumer settingKey="movie" defaultValue="media" frames={frames} />)

  const movieFrames = frames.filter((frame) => frame.key === 'movie').map((frame) => frame.value)
  expect(movieFrames.every((value) => value === 'media')).toBe(true)
})

it('follows a changed default for a key without a stored setting', () => {
  const frames: Frame[] = []
  const {rerender} = render(<Consumer settingKey="author" defaultValue="default" frames={frames} />)
  const before = frames.length

  rerender(<Consumer settingKey="author" defaultValue="media" frames={frames} />)

  expect(frames.slice(before).every((frame) => frame.value === 'media')).toBe(true)
})
