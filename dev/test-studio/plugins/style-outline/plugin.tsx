import {lazy, Suspense} from 'react'
import {definePlugin, type LayoutProps} from 'sanity'

const StyleOutlinePanel = lazy(() => import('./StyleOutlinePanel'))

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
  studio: {
    components: {
      layout: StyleOutlineLayout,
    },
  },
})
