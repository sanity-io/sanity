import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import EditItemPopOver from 'part:@sanity/components/edititem/popover'

const style = {
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const centered = function (storyFn) {
  return <div style={style}>{storyFn()}</div>
}

storiesOf('Edit item')
.addDecorator(centered)
.addWithInfo(
  'PopOver',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div>
        Things is in the background here.
        <EditItemPopOver title="Edit this item" onClose={action('onClose')}>
          Put your form here
        </EditItemPopOver>
      </div>
    )
  },
  {
    propTables: [EditItemPopOver],
    role: 'part:@sanity/components/edititem/popover'
  }
)
