import {definePlugin, type LayoutProps} from 'sanity'

import {StyleOutlinePanel} from './StyleOutlinePanel'

function StyleOutlineLayout(props: LayoutProps) {
  return (
    <>
      {props.renderDefault(props)}
      <StyleOutlinePanel />
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
