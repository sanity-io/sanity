import {render, screen, waitFor} from '@testing-library/react'
import {type ComponentProps} from 'react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {ReleaseDocumentsCounter} from '../../columnCells/ReleaseDocumentsCounter'

const renderTest = async (props: ComponentProps<typeof ReleaseDocumentsCounter>) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  render(<ReleaseDocumentsCounter {...props} />, {wrapper})

  await waitFor(() => {
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })
}

describe('ReleaseDocumentsCounter', () => {
  it('renders "-" when documentCount is undefined', async () => {
    await renderTest({documentCount: undefined})

    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders the singular text when documentCount is 1', async () => {
    await renderTest({documentCount: 1})

    expect(screen.getByText('1 document')).toBeInTheDocument()
  })

  it('renders the plural text when documentCount is greater than 1', async () => {
    await renderTest({documentCount: 5})

    expect(screen.getByText('5 documents')).toBeInTheDocument()
  })
})
