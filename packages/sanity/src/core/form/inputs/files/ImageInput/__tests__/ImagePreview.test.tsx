import {act, fireEvent, render, screen} from '@testing-library/react'
import {Activity} from 'react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {ImagePreview} from '../ImagePreview'

function Harness({mode, src}: {mode: 'visible' | 'hidden'; src: string}) {
  return (
    <Activity mode={mode}>
      <ImagePreview alt="" src={src} />
    </Activity>
  )
}

describe('ImagePreview', () => {
  it('stays loaded while hidden by an Activity boundary and starts over for a new src', async () => {
    const wrapper = await createTestProvider()
    const {rerender} = render(<Harness mode="visible" src="/first.png" />, {wrapper})
    const image = await screen.findByTestId('hotspot-image-input')
    expect(screen.getByTestId('loading-block')).toBeInTheDocument()

    fireEvent.load(image)
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()

    // A complete image does not fire `load` again when the boundary is shown, so the loaded
    // state must survive the hidden period (the hidden re-render is deferred, hence the tick).
    rerender(<Harness mode="hidden" src="/first.png" />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    rerender(<Harness mode="visible" src="/first.png" />)
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()

    rerender(<Harness mode="visible" src="/second.png" />)
    expect(screen.getByTestId('loading-block')).toBeInTheDocument()
    fireEvent.load(screen.getByTestId('hotspot-image-input'))
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })
})
