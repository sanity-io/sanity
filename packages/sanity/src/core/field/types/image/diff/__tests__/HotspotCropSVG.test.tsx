import {diffInput, wrap} from '@sanity/diff'
import {type Image, type ImageCrop} from '@sanity/types'
import {render} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {ColorSchemeProvider} from '../../../../../studio/colorScheme'
import {UserColorManagerProvider} from '../../../../../user-color/provider'
import {type AnnotationDetails, type ObjectDiff} from '../../../../types'
import {HotspotCropSVG} from '../HotspotCropSVG'

const ANNOTATION: AnnotationDetails = {author: 'doug', timestamp: '2020-06-15T12:00:00.000Z'}

const CROP: ImageCrop = {top: 0.1, bottom: 0.25, left: 0.2, right: 0.05}

const DIFF = diffInput(
  wrap({_type: 'image'}, ANNOTATION),
  wrap({_type: 'image', crop: CROP}, ANNOTATION),
) as ObjectDiff<Image>

async function renderCropRect(crop: ImageCrop) {
  const TestProvider = await createTestProvider()
  function wrapper({children}: {children: ReactNode}) {
    return (
      <TestProvider>
        <ColorSchemeProvider scheme="light">
          <UserColorManagerProvider>{children}</UserColorManagerProvider>
        </ColorSchemeProvider>
      </TestProvider>
    )
  }
  const {container} = render(
    <HotspotCropSVG crop={crop} diff={DIFF} hash="test" width={200} height={100} />,
    {wrapper},
  )
  return container.querySelector('rect')
}

describe('HotspotCropSVG', () => {
  it('draws the crop as a rectangle over the preview box', async () => {
    const rect = await renderCropRect(CROP)

    expect(Number(rect?.getAttribute('x'))).toBeCloseTo(40)
    expect(Number(rect?.getAttribute('y'))).toBeCloseTo(10)
    expect(Number(rect?.getAttribute('width'))).toBeCloseTo(150)
    expect(Number(rect?.getAttribute('height'))).toBeCloseTo(65)
  })

  it('keeps fractional pixel positions', async () => {
    const rect = await renderCropRect({top: 0.0033, bottom: 0, left: 0.0033, right: 0.0067})

    expect(Number(rect?.getAttribute('x'))).toBeCloseTo(0.66)
    expect(Number(rect?.getAttribute('y'))).toBeCloseTo(0.33)
    expect(Number(rect?.getAttribute('width'))).toBeCloseTo(198)
    expect(Number(rect?.getAttribute('height'))).toBeCloseTo(99.67)
  })
})
