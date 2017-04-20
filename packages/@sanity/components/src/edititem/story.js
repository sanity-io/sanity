/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import Button from 'part:@sanity/components/buttons/default'
import Sanity from 'part:@sanity/storybook/addons/sanity'


const overflowHidden = {
  minHeight: '100vh',
  maxWidth: '100vw',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box'
}

storiesOf('Edit item')
.add(
  'PopOver',
  () => {
    return (
      <div style={overflowHidden} id="myScrollContainerId">
        Things is in the background here.
        <Button onClick={action('oh noes! I should not ble clickable!')}>Try click me</Button>
        <Sanity part="part:@sanity/components/edititem/popover" propTables={[EditItemPopOver]}>
          <EditItemPopOver title="Edit this item" onClose={action('onClose')} scrollContainerId="myScrollContainerId">
            Put your form here
          </EditItemPopOver>
        </Sanity>
      </div>
    )
  }
)
.add(
  'Fold',
  () => {
    return (
      <div style={{width: '50%', margin: '0 auto', backgroundColor: '#ccc', minHeight: '50vh', paddingTop: '5rem'}}>
        <Sanity part="part:@sanity/components/edititem/popover" propTables={[EditItemPopOver]}>
          <EditItemFold title="Edit this item" onClose={action('onClose')}>
            Put your form here
          </EditItemFold>
        </Sanity>
      </div>
    )
  }
)
