import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {agentDebugLog} from '../../../../../test/browser/agentDebugLog'
import {FormChromeStory} from './FormChromeStory'

/**
 * Chromatic sentinel for misc form chrome: fields, fieldsets, incompatible
 * array items, member errors, and an input error boundary. Fixture copy only;
 * the play step opens the migrated popover and member-error details.
 */
const meta = {
  title: 'Form/Misc Chrome',
  component: FormChromeStory,
} satisfies Meta<typeof FormChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    // #region agent log
    agentDebugLog({
      hypothesisId: 'E',
      location: 'FormChrome.stories.tsx:play:start',
      message: 'play function entered',
      data: {
        bodyTextLength: document.body?.innerText?.length ?? 0,
        bodySnippet: (document.body?.innerText || '').slice(0, 240),
        hasPreparing: /preparing/i.test(document.body?.innerText || ''),
      },
    })
    // #endregion
    const body = within(document.body)
    try {
      await waitFor(
        () => expect(body.getByText('The fixture input could not render')).toBeVisible(),
        {
          timeout: 5000,
        },
      )
    } catch (err) {
      // #region agent log
      agentDebugLog({
        hypothesisId: 'E',
        location: 'FormChrome.stories.tsx:play:waitFailed',
        message: 'waitFor fixture error text failed',
        data: {
          error: err instanceof Error ? err.message.slice(0, 400) : String(err),
          bodySnippet: (document.body?.innerText || '').slice(0, 400),
          // Exact translated ErrorCard copy is "Error: The fixture input could not render"
          hasExactFixture: Boolean(
            document.body?.innerText?.includes('The fixture input could not render'),
          ),
          hasPrefixedFixture: Boolean(
            document.body?.innerText?.includes('Error: The fixture input could not render'),
          ),
        },
      })
      // #endregion
      throw err
    }

    await userEvent.click(
      body.getByRole('button', {name: /Item of type .* not valid for this list/}),
    )
    await waitFor(
      () =>
        expect(body.getByText(/The current schema does not declare items of type/)).toBeVisible(),
      {timeout: 5000},
    )

    for (const detailsButton of body.getAllByRole('button', {name: 'Developer info'})) {
      if (detailsButton.nextElementSibling?.hasAttribute('hidden')) {
        await userEvent.click(detailsButton)
      }
    }

    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
