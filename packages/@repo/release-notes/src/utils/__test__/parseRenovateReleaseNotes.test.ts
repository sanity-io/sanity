import {portableTextToMarkdown} from '@portabletext/markdown'
import {describe, expect, it} from 'vitest'

import {
  parseRenovateReleaseNotes,
  RENOVATE_RELEASE_NOTES_PACKAGES,
} from '../parseRenovateReleaseNotes'
import {readFixture} from './helpers'

describe('parseRenovateReleaseNotes', () => {
  it('parses @sanity/cli Renovate body and returns portable text with bug fix and feature content', async () => {
    const body = await readFixture('renovate-cli-update.md')
    const blocks = parseRenovateReleaseNotes(body)

    expect(blocks.length).toBeGreaterThan(0)

    const markdown = portableTextToMarkdown(blocks)

    // Should contain bug fix descriptions
    expect(markdown).toContain('use non-deprecated `--project-id` flag')
    expect(markdown).toContain('bump react+react-dom to latest')
    expect(markdown).toContain('lazy-load icon resolver')

    // Should contain feature descriptions
    expect(markdown).toContain('add new `--template` flag')

    // Should NOT contain Dependencies section content
    expect(markdown).not.toContain('workspace dependencies were updated')
    expect(markdown).not.toContain('cli-core bumped')

    // Should NOT contain commit hashes or PR refs
    expect(markdown).not.toMatch(/\(\[#\d+]\(/)
    expect(markdown).not.toMatch(/\(\[[0-9a-f]{7}]\(/)

    // Should NOT contain content from non-allowlisted packages
    expect(markdown).not.toContain('some unrelated fix')
  })

  it('ignores <details> blocks for packages NOT in the allowlist', () => {
    const body = `### Release Notes

<details>
<summary>some-org/some-repo (not-in-allowlist)</summary>

### [\`v1.0.0\`](https://example.com)

##### Bug Fixes

- some fix ([#1](https://example.com)) ([abc1234](https://example.com))

</details>`

    const blocks = parseRenovateReleaseNotes(body)
    expect(blocks).toEqual([])
  })

  it('filters out Dependencies and hidden sections', () => {
    const body = `### Release Notes

<details>
<summary>sanity-io/cli (@sanity/cli)</summary>

### [\`v1.0.0\`](https://example.com)

##### Bug Fixes

- a visible fix ([#1](https://example.com)) ([abc1234](https://example.com))

##### Dependencies

- dep bumped to 2.0.0

##### Styles

- reformatted code

##### Miscellaneous Chores

- updated config

</details>`

    const blocks = parseRenovateReleaseNotes(body)
    const markdown = portableTextToMarkdown(blocks)

    expect(markdown).toContain('a visible fix')
    expect(markdown).not.toContain('dep bumped')
    expect(markdown).not.toContain('reformatted code')
    expect(markdown).not.toContain('updated config')
  })

  it('strips commit hashes and PR refs from list items', () => {
    const body = `### Release Notes

<details>
<summary>sanity-io/cli (@sanity/cli)</summary>

### [\`v1.0.0\`](https://example.com)

##### Bug Fixes

- fix something important ([#123](https://example.com/issues/123)) ([deadbeef](https://example.com/commit/deadbeef))

</details>`

    const blocks = parseRenovateReleaseNotes(body)
    const markdown = portableTextToMarkdown(blocks)

    expect(markdown).toContain('fix something important')
    expect(markdown).not.toContain('#123')
    expect(markdown).not.toContain('deadbeef')
  })

  it('returns empty for non-Renovate PR bodies', () => {
    const body = `### Notes for release

Some normal release notes here.`

    const blocks = parseRenovateReleaseNotes(body)
    expect(blocks).toEqual([])
  })

  it('handles empty <details> blocks gracefully', () => {
    const body = `### Release Notes

<details>
<summary>sanity-io/cli (@sanity/cli)</summary>

</details>`

    const blocks = parseRenovateReleaseNotes(body)
    expect(blocks).toEqual([])
  })

  it('preserves version headers that have visible sections', () => {
    const body = `### Release Notes

<details>
<summary>sanity-io/cli (@sanity/cli)</summary>

### [\`v2.0.0\`](https://example.com)

##### Features

- new feature A

### [\`v1.0.0\`](https://example.com)

##### Bug Fixes

- fix B

</details>`

    const blocks = parseRenovateReleaseNotes(body)
    const markdown = portableTextToMarkdown(blocks)

    expect(markdown).toContain('v2.0.0')
    expect(markdown).toContain('new feature A')
    expect(markdown).toContain('v1.0.0')
    expect(markdown).toContain('fix B')
  })

  it('removes version headers with only hidden sections', () => {
    const body = `### Release Notes

<details>
<summary>sanity-io/cli (@sanity/cli)</summary>

### [\`v2.0.0\`](https://example.com)

##### Features

- visible feature

### [\`v1.0.0\`](https://example.com)

##### Dependencies

- only hidden deps content here

</details>`

    const blocks = parseRenovateReleaseNotes(body)
    const markdown = portableTextToMarkdown(blocks)

    expect(markdown).toContain('v2.0.0')
    expect(markdown).toContain('visible feature')
    // v1.0.0 header should be removed since it only has Dependencies
    expect(markdown).not.toContain('v1.0.0')
    expect(markdown).not.toContain('hidden deps content')
  })

  it('strips renovate-debug HTML comments', () => {
    const body = `### Release Notes

<details>
<summary>sanity-io/cli (@sanity/cli)</summary>

### [\`v1.0.0\`](https://example.com)

##### Bug Fixes

- a fix

</details>
<!--renovate-debug:eyJjcmVhdGVkSW5WZXIiOiI0My42Ni40In0=-->`

    const blocks = parseRenovateReleaseNotes(body)
    const markdown = portableTextToMarkdown(blocks)

    expect(markdown).not.toContain('renovate-debug')
    expect(markdown).toContain('a fix')
  })

  it('handles zero-width space entities in summary', () => {
    const body = `### Release Notes

<details>
<summary>sanity-io/cli (@&#8203;sanity/cli)</summary>

### [\`v1.0.0\`](https://example.com)

##### Bug Fixes

- a fix

</details>`

    const blocks = parseRenovateReleaseNotes(body)
    expect(blocks.length).toBeGreaterThan(0)
  })
})

describe('RENOVATE_RELEASE_NOTES_PACKAGES', () => {
  it('contains @sanity/cli', () => {
    expect(RENOVATE_RELEASE_NOTES_PACKAGES.has('@sanity/cli')).toBe(true)
  })
})
