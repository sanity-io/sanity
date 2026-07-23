import {portableTextToMarkdown} from '@portabletext/markdown'
import {describe, expect, it, vi} from 'vitest'

import {type ExtractSectionOptions} from '../extractSectionWithLlm'
import {extractReleaseNotesFromPrBody} from '../pullRequestReleaseNotes'

function mockClient(returnText: string): NonNullable<ExtractSectionOptions['client']> {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({content: [{type: 'text', text: returnText}]}),
    } as unknown as NonNullable<ExtractSectionOptions['client']>['messages'],
  }
}

function throwingClient(): NonNullable<ExtractSectionOptions['client']> {
  return {
    messages: {
      create: vi.fn().mockRejectedValue(new Error('api down')),
    } as unknown as NonNullable<ExtractSectionOptions['client']>['messages'],
  }
}

describe('extractReleaseNotesFromPrBody', () => {
  it('takes the deterministic path when the section contains a horizontal rule', async () => {
    const client = mockClient('SHOULD NOT BE CALLED')
    const prBody = `### Description
Something.

### Notes for release

Adds a new feature.

---

Cursor summary here.`

    const blocks = await extractReleaseNotesFromPrBody(prBody, {client})
    expect(portableTextToMarkdown(blocks).trim()).toEqual('Adds a new feature.')
    expect(client.messages.create).not.toHaveBeenCalled()
  })

  it('routes to the LLM when the section has no horizontal rule', async () => {
    const prBody = `### Notes for release

Adds a new feature.

<!-- CURSOR_SUMMARY -->
> [!NOTE]
> Cursor review.
<!-- /CURSOR_SUMMARY -->`
    const client = mockClient('Adds a new feature.')

    const blocks = await extractReleaseNotesFromPrBody(prBody, {client})
    expect(portableTextToMarkdown(blocks).trim()).toEqual('Adds a new feature.')
    expect(client.messages.create).toHaveBeenCalledTimes(1)
  })

  it('returns [] when the LLM responds with N/A', async () => {
    const prBody = `### Notes for release

N/A`
    const client = mockClient('N/A')

    const blocks = await extractReleaseNotesFromPrBody(prBody, {client})
    expect(blocks).toEqual([])
  })

  it('falls back to deterministic extraction when the LLM output is not a substring of the section', async () => {
    const prBody = `### Notes for release

Adds a new feature.

Cursor summary here.`
    const client = mockClient('Something the LLM invented that is not in the input.')

    const blocks = await extractReleaseNotesFromPrBody(prBody, {client})
    expect(portableTextToMarkdown(blocks)).toContain('Adds a new feature.')
    expect(portableTextToMarkdown(blocks)).toContain('Cursor summary here.')
  })

  it('falls back to deterministic extraction when the LLM call throws', async () => {
    const prBody = `### Notes for release

Adds a new feature.

Cursor summary here.`
    const client = throwingClient()
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const blocks = await extractReleaseNotesFromPrBody(prBody, {client})
    expect(portableTextToMarkdown(blocks)).toContain('Adds a new feature.')
    consoleWarn.mockRestore()
  })

  it('returns [] when the PR body has no Notes-for-release section', async () => {
    const client = mockClient('SHOULD NOT BE CALLED')
    const prBody = `### Description
Some other content.`

    const blocks = await extractReleaseNotesFromPrBody(prBody, {client})
    expect(blocks).toEqual([])
    expect(client.messages.create).not.toHaveBeenCalled()
  })
})
