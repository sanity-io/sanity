import {Card, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {beforeAll, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'

import {RatioBox} from '../../../common/RatioBox'
import {HotspotImage} from '../HotspotImage'

const theme = buildTheme()

// The layout is driven entirely by the styles `calculateStyles` computes, so the
// intrinsic size of the image is irrelevant here.
const SRC = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

const CROP = {top: 0, bottom: 0.014, left: 0.138, right: 0.182}
const HOTSPOT = {x: 0.467, y: 0.493, height: 0.984, width: 0.617}

const PREVIEW_ASPECT_RATIOS = [3 / 4, 1, 16 / 9, 4]

// The studio applies a global reset (via `@sanity-labs/ui-poc/styles.css`) that
// clamps every image to the width of its container. `HotspotImage` scales the
// image past its crop viewport, so it has to survive that reset.
beforeAll(() => {
  const style = document.createElement('style')
  style.textContent = 'img,object,picture,video{display:block;max-width:100%}'
  document.head.appendChild(style)
})

function renderPreview(aspectRatio: number, srcAspectRatio: number) {
  return render(
    <ThemeProvider theme={theme}>
      <div style={{width: 147}}>
        <RatioBox ratio={aspectRatio}>
          <Card __unstable_checkered border>
            <HotspotImage
              aspectRatio={aspectRatio}
              src={SRC}
              srcAspectRatio={srcAspectRatio}
              hotspot={HOTSPOT}
              crop={CROP}
            />
          </Card>
        </RatioBox>
      </div>
    </ThemeProvider>,
  )
}

function measure(root: HTMLElement) {
  const img = root.querySelector('img')!
  const cropBox = img.parentElement!
  return {img: img.getBoundingClientRect(), crop: cropBox.getBoundingClientRect()}
}

describe('HotspotImage', () => {
  for (const srcAspectRatio of [1, 16 / 9, 2 / 3]) {
    for (const aspectRatio of PREVIEW_ASPECT_RATIOS) {
      it(`renders a ${srcAspectRatio.toFixed(2)} image undistorted in a ${aspectRatio.toFixed(2)} preview`, async () => {
        const {container} = await renderPreview(aspectRatio, srcAspectRatio)
        const {img, crop} = measure(container as HTMLElement)

        // The image must keep the aspect ratio of the source, otherwise the
        // preview shows a stretched or squashed version of the image.
        expect(img.width / img.height).toBeCloseTo(srcAspectRatio, 2)

        // ...and it must cover the crop viewport, otherwise the preview shows
        // the wrong part of the image with a gap next to it.
        expect(img.width).toBeGreaterThanOrEqual(crop.width - 0.5)
        expect(img.height).toBeGreaterThanOrEqual(crop.height - 0.5)
      })
    }
  }
})
