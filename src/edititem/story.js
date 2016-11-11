import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import Draggable from 'react-draggable'

import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import Button from 'part:@sanity/components/buttons/default'

import Chance from 'chance'
const chance = new Chance()

const overflowHidden = {
  minHeight: '100vh',
  maxWidth: '100vw',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box'
}

const overflowScroll = {
  height: '90vh',
  maxHeight: '90vh',
  width: '100vw',
  position: 'relative',
  overflowY: 'scroll',
  overflowX: 'visible',
  boxSizing: 'border-box',
  border: '10px solid red'
}

class Mover extends React.Component {

  static propTypes = {
    children: React.PropTypes.node
  }

  constructor(props, args) {
    super(props, args)
    this.state = {
      x: 50,
      y: 50
    }
  }

  handleStop = (event, element) => {
    const scrollTop = document.getElementById('myScrollContainerId').scrollTop
    // Trigger window resize to force redrawing of the popover component
    window.dispatchEvent(new Event('resize'))
    this.setState({
      x: event.pageX - event.offsetX,
      y: event.pageY - event.offsetY + scrollTop
    })
  }

  render() {
    return (
      <div className="moverElement">
        <Draggable onStop={this.handleStop}>
          <div
            style={{
              zIndex: 1061,
              position: 'absolute',
              cursor: 'move',
              color: 'white',
              backgroundColor: 'red',
              padding: '10px'
            }}
          >
            Move me
          </div>
        </Draggable>
        <div style={{position: 'absolute', top: `${this.state.y + 50}px`, left: `${this.state.x - 10}px`}}>
          <div style={{color: 'red', position: 'absolute', zIndex: '5000', backgroundColor: 'black'}}>
            x: {this.state.x - 10} y: {this.state.y + 50}
          </div>
          {this.props.children}
        </div>
      </div>
    )
  }
}

storiesOf('Edit item')
.addWithInfo(
  'PopOver',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div style={overflowHidden} id="myScrollContainerId">
        Things is in the background here.
        <Button onClick={action('oh noes! I should not ble clickable!')}>Try click me</Button>
        <EditItemPopOver title="Edit this item" onClose={action('onClose')} scrollContainerId="myScrollContainerId">
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
.addWithInfo(
  'PopOver (Full Width)',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div style={overflowHidden} id="myScrollContainerId">
        Things is in the background here.
        <EditItemPopOver title="Edit this item" onClose={action('onClose')} fullWidth scrollContainerId="myScrollContainerId">
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

.addWithInfo(
  'PopOver (position test)',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div style={overflowHidden} id="myScrollContainerId">
        <Mover>
          <EditItemPopOver title="Edit this item" onClose={action('onClose')} scrollContainerId="myScrollContainerId">
            Put your form here
          </EditItemPopOver>
        </Mover>
        <p>{chance.paragraph({sentences: 200})}</p>
      </div>
    )
  },
  {
    propTables: [EditItemPopOver],
    role: 'part:@sanity/components/edititem/popover'
  }
)

.addWithInfo(
  'PopOver (position test with content)',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div style={overflowScroll} id="myScrollContainerId">
        <Mover>
          <EditItemPopOver title="Edit this item" onClose={action('onClose')} scrollContainerId="myScrollContainerId">
            <h2>{chance.sentence()}</h2>
            <p>{chance.paragraph({sentences: 5})}</p>
          </EditItemPopOver>
        </Mover>
        <p>{chance.paragraph({sentences: 50})}</p>
      </div>

    )
  },
  {
    propTables: [EditItemPopOver],
    role: 'part:@sanity/components/edititem/popover'
  }
)
.addWithInfo(
  'PopOver (position test Full Width)',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <div id="myScrollContainerId">
        <Mover>
          <EditItemPopOver title="Edit this item" onClose={action('onClose')} fullWidth scrollContainerId="myScrollContainerId">
            Put your form here
          </EditItemPopOver>
        </Mover>
        <p>{chance.paragraph({sentences: 200})}</p>
      </div>
    )
  },
  {
    propTables: [EditItemPopOver],
    role: 'part:@sanity/components/edititem/popover'
  }
)
