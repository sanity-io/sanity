import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import EditItemPopOver from 'part:@sanity/components/edititem/popover'

storiesOf('Edit item')
.addWithInfo(
  'PopOver',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <EditItemPopOver title="Edit this item" onClose={action('onClose')}>
        <h1>Put your form here</h1>
      </EditItemPopOver>
    )
  },
  {
    propTables: [EditItemPopOver],
    role: 'part:@sanity/components/edititem/popover'
  }
)
