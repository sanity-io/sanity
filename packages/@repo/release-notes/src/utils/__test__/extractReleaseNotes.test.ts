import {readFile} from 'node:fs/promises'

import {markdownToPortableText, portableTextToMarkdown} from '@portabletext/markdown'
import {describe, expect, it} from 'vitest'

import {extractReleaseNotes} from '../extractReleaseNotes'

function readFixture(name: string) {
  return readFile(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8')
}

describe('extractReleaseNotesFromPRDescription', () => {
  it('extracts release notes from PR description', async () => {
    const notes = extractReleaseNotes(markdownToPortableText(await readFixture('pr-1.md')))
    expect(portableTextToMarkdown(notes)).toEqual(
      `Schema errors screen now contains a button to copy schema type errors as Markdown.`,
    )
  })
  it('extracts release notes when there is just a single release notes header', () => {
    const notes = extractReleaseNotes(
      markdownToPortableText(`### Notes for release

These are the release notes
`),
    )
    expect(portableTextToMarkdown(notes)).toEqual(`These are the release notes`)
  })
  it('skips html comments ', async () => {
    const notes = extractReleaseNotes(markdownToPortableText(await readFixture('template.md')))
    expect(notes).toEqual([])
  })
  it.each(['n/a', 'N/A', 'n/a – internal only', '\n n/a'])(
    'ignores if text starts with %s ',
    async (a) => {
      const notes = extractReleaseNotes(
        markdownToPortableText(`### Notes for release
${a}
`),
      )
      expect(notes).toEqual([])
    },
  )
  it('skips inline html comments', () => {
    const notes = extractReleaseNotes(
      markdownToPortableText(`
### Notes for release

this is <!-- foo -->a release note
`),
    )
    expect(notes).toEqual([
      expect.objectContaining({
        _key: expect.any(String),
        _type: 'block',
        children: [
          expect.objectContaining({
            _key: expect.any(String),
            _type: 'span',
            marks: [],
            text: 'this is a release note',
          }),
        ],
        markDefs: [],
        style: 'normal',
      }),
    ])
  })
})
