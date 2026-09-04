import {lazy, Suspense} from 'react'
import {definePlugin, type LayoutProps} from 'sanity'

const StyleOutlinePanel = lazy(() =>
  import('./StyleOutlinePanel').then((module) => ({default: module.StyleOutlinePanel})),
)

function StyleOutlineLayout(props: LayoutProps) {
  return (
    <>
      {props.renderDefault(props)}
      <Suspense fallback={null}>
        <StyleOutlinePanel />
      </Suspense>
    </>
  )
}

export const styleOutline = definePlugin({
  name: 'style-outline',
  // Must stay this exact member expression so Sanity's env replace can see it.
  ...(process.env.SANITY_STUDIO_STYLE_OUTLINE === 'true'
    ? {
        studio: {
          components: {
            layout: StyleOutlineLayout,
          },
        },
      }
    : {}),
})
