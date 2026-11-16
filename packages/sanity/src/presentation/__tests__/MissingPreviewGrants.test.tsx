import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {presentationUsEnglishLocaleBundle} from '../i18n'
import {MissingPreviewGrants} from '../MissingPreviewGrants'

describe('MissingPreviewGrants', () => {
  it('names the current role instead of a connection failure', async () => {
    const wrapper = await createTestProvider({
      resources: [presentationUsEnglishLocaleBundle],
    })
    render(<MissingPreviewGrants />, {wrapper})

    expect(
      await screen.findByText(
        "Your role (Administrator) can't open the preview. Ask a project administrator for a role that can edit.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('An error occurred')).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Continue anyway'})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Retry'})).not.toBeInTheDocument()
    expect(screen.queryByText(/Unable to connect/)).not.toBeInTheDocument()
  })
})
