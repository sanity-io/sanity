import {portableTextToMarkdown} from '@portabletext/markdown'
import {describe, expect, it} from 'vitest'

import {markdownToPortableText} from '../portabletext-markdown/markdownToPortableText'
import {extractReleaseNotes, shouldExcludeReleaseNotes} from '../pullRequestReleaseNotes'
import {keyGenerator, readFixture} from './helpers'

describe('extractReleaseNotesFromPullRequestDescription', () => {
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
  it('extracts images and html ', async () => {
    const notes = extractReleaseNotes(
      markdownToPortableText(await readFixture('pr-with-images.md'), {
        keyGenerator: keyGenerator(),
      }),
    )
    expect(notes).toMatchInlineSnapshot(`
      [
        {
          "_key": "key-6",
          "_type": "block",
          "children": [
            {
              "_key": "key-7",
              "_type": "span",
              "marks": [],
              "text": "In markdown’s gentle, ticking time,
      I shape my thoughts in simple rhyme—
      With hashes bold and asterisks bright,
      I carve out headings in the night.",
            },
          ],
          "markDefs": [],
          "style": "normal",
        },
        {
          "_key": "key-8",
          "_type": "block",
          "children": [
            {
              "_key": "key-9",
              "_type": "image",
              "alt": "",
              "src": "https://github.com/user-attachments/assets/ba950690-8b08-4b56-b6e0-efc1fb348251",
            },
            {
              "_key": "key-11",
              "_type": "span",
              "marks": [
                "key-10",
              ],
              "text": "pr-with-images.md",
            },
          ],
          "markDefs": [
            {
              "_key": "key-10",
              "_type": "link",
              "href": "pr-with-images.md",
            },
          ],
          "style": "normal",
        },
        {
          "_key": "key-18",
          "_type": "image",
          "alt": "Screenshot 2026-01-28 at 12 55 05",
          "src": "https://github.com/user-attachments/assets/d9940c9c-a14e-46ab-9145-ec87a78d0d95",
        },
        {
          "_key": "key-13",
          "_type": "block",
          "children": [
            {
              "_key": "key-14",
              "_type": "span",
              "marks": [],
              "text": "Some gifs:
      ",
            },
            {
              "_key": "key-15",
              "_type": "image",
              "alt": "filterReleaseDocumentsSimplePR",
              "src": "https://github.com/user-attachments/assets/a1670ec5-b5fa-488d-9e3a-4ec288805784",
            },
          ],
          "markDefs": [],
          "style": "normal",
        },
        {
          "_key": "key-20",
          "_type": "image",
          "alt": "Image",
          "src": "https://github.com/user-attachments/assets/a1670ec5-b5fa-488d-9e3a-4ec288805784",
        },
      ]
    `)
  })
  it('extracts code examples', () => {
    const notes = extractReleaseNotes(
      markdownToPortableText(`### Notes for release
\`\`\`js
console.log('code!')
\`\`\`
`),
    )
    expect(notes).toEqual([
      expect.objectContaining({
        _key: expect.any(String),
        _type: 'code',
        language: 'js',
        code: "console.log('code!')",
      }),
    ])
  })
  it.each(['n/a', 'N/A', 'n/a – internal only', '\n n/a', 'Not relevant', 'not required'])(
    'ignores if text starts with %s ',
    (a) => {
      const markdown = `### Notes for release
${a}
`
      expect(
        shouldExcludeReleaseNotes(extractReleaseNotes(markdownToPortableText(markdown))),
      ).toEqual(true)
    },
  )
  it('treats missing release notes as not excluded', () => {
    expect(
      shouldExcludeReleaseNotes(
        extractReleaseNotes(markdownToPortableText(`this is just some markdown`)),
      ),
    ).toEqual(false)
  })
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
