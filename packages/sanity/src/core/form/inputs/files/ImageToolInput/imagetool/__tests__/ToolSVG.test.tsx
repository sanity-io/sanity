import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {ToolSVG} from '../ToolSVG'
import {type Crop} from '../types'

const theme = buildTheme()

const IMAGE_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

function renderCropBadge(crop: Crop | undefined, sourceSize: {width: number; height: number}) {
  const {container} = render(
    <ThemeProvider theme={theme}>
      <ToolSVG
        value={{crop}}
        image={Object.assign(new Image(), {src: IMAGE_URL})}
        sourceSize={sourceSize}
        hotspotEnabled={false}
        onChange={() => undefined}
        onChangeEnd={() => undefined}
        readOnly={false}
        size={{width: 300, height: 200}}
      />
    </ThemeProvider>,
  )
  return Array.from(container.querySelectorAll('title')).map((title) => title.textContent)
}

describe('ToolSVG crop dimensions badge', () => {
  it('shows the source size when the value has no crop', () => {
    expect(renderCropBadge(undefined, {width: 2000, height: 1000})).toContain(
      'Cropped image size: 2000 × 1000 pixels',
    )
  })

  it('shows the cropped size in source pixels, rounded to whole pixels', () => {
    const crop: Crop = {top: 0.1234, bottom: 0.05, left: 0.1, right: 0.2567}
    expect(renderCropBadge(crop, {width: 999, height: 333})).toContain(
      'Cropped image size: 643 × 275 pixels',
    )
  })
})
