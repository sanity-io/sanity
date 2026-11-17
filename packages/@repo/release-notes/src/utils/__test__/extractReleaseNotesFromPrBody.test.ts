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

  it('drops the Cursor agent footer and artifacts hint, as found in a real Cursor PR body', async () => {
    const note = 'Document lists now end their items at the same distance from the pane edge.'
    const client = mockClient(note)
    const prBody = `<!-- CURSOR_AGENT_PR_BODY_BEGIN -->
### Description

Something.

### Notes for release

Document lists now end their items at the same distance from the pane edge.

<sub>To show artifacts inline, <a href="https://cursor.com/dashboard/cloud-agents#team-pull-requests">enable</a> in settings.</sub>
<!-- CURSOR_AGENT_PR_BODY_END -->

<div><a href="https://cursor.com/agents/bc-1?cursor_ref=pr_footer&cursor_cta=open_in_web"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cursor.com/assets/images/open-in-web-dark.png"><img alt="Open in Web" width="114" height="28" src="https://cursor.com/assets/images/open-in-web-dark.png"></picture></a>&nbsp;<a href="https://cursor.com/background-agent?bcId=bc-1&cursor_ref=pr_footer&cursor_cta=open_in_cursor"><picture><img alt="Open in Cursor" width="131" height="28" src="https://cursor.com/assets/images/open-in-cursor-dark.png"></picture></a>&nbsp;</div>
`

    const blocks = await extractReleaseNotesFromPrBody(prBody, {client})
    expect(portableTextToMarkdown(blocks).trim()).toEqual(note)
    expect(blocks.some((block) => block._type === 'image')).toBe(false)

    // The footer and hint are gone before the section reaches the LLM cleaner.
    const prompt = JSON.stringify(vi.mocked(client.messages.create).mock.calls[0])
    expect(prompt).not.toContain('cursor.com')
    expect(prompt).not.toContain('To show artifacts inline')
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
