import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'

import EditItemPopOver from 'component:@sanity/components/edititem/popover'

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
    role: 'component:@sanity/components/edititem/popover'
  }
)
