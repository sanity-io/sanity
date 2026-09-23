import {expect, test} from 'vitest'

import {githubAvatarUrl} from './useGravatar'

test('resolves modern GitHub noreply emails via the embedded user id', () => {
  expect(githubAvatarUrl('265501495+squiggler-app[bot]@users.noreply.github.com', 66)).toBe(
    'https://avatars.githubusercontent.com/u/265501495?s=66&v=4',
  )
})

test('resolves old-style GitHub noreply emails via the login', () => {
  expect(githubAvatarUrl('bjoerge@users.noreply.github.com', 66)).toBe(
    'https://github.com/bjoerge.png?size=66',
  )
})

test('returns undefined for regular emails (gravatar handles those)', () => {
  expect(githubAvatarUrl('ada@example.com', 66)).toBeUndefined()
  expect(githubAvatarUrl('someone@users.noreply.gitlab.com', 66)).toBeUndefined()
})
