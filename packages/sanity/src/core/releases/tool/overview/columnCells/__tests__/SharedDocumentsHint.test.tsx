import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {studioDefaultLocaleResources} from '../../../../../i18n/bundles/studio'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {SharedDocumentsHint} from '../SharedDocumentsHint'

const resources = [studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]

describe('SharedDocumentsHint', () => {
  it('renders nothing when no document is shared', async () => {
    const wrapper = await createTestProvider({resources})
    render(<SharedDocumentsHint count={0} />, {wrapper})
    expect(screen.queryByTestId('shared-documents-hint')).not.toBeInTheDocument()
  })

  it('labels the count in text, so it does not read as a second document count', async () => {
    const wrapper = await createTestProvider({resources})
    render(<SharedDocumentsHint count={3} />, {wrapper})
    expect(screen.getByTestId('shared-documents-hint')).toHaveTextContent('3 shared')
  })
})
