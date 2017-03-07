/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import Draggable from 'react-draggable'

import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import Button from 'part:@sanity/components/buttons/default'

import {range, random} from 'lodash'
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
  height: '100vh',
  maxHeight: '100vh',
  width: '100vw',
  position: 'relative',
  overflowY: 'scroll',
  overflowX: 'visible',
  boxSizing: 'border-box',
  border: '5px solid red'
}

const overflowScrollOffset = {
  height: '80vh',
  maxHeight: '100vh',
  width: '80vw',
  position: 'absolute',
  top: '10vh',
  left: '10vw',
  overflowY: 'scroll',
  overflowX: 'visible',
  boxSizing: 'border-box',
  border: '5px solid red'
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

class EditItemPopOverComponent extends React.Component {

  static propTypes = {
    children: React.PropTypes.node,
    onClose: React.PropTypes.func
  }

  constructor(props, args) {
    super(props, args)
    this.state = {
      opened: false
    }
  }

  handleClose = () => {
    this.setState({
      opened: false
    })
    this.props.onClose()
  }

  handleOpen = () => {
    this.setState({
      opened: true
    })
  }

  render() {

    const {opened} = this.state

    return (
      <span style={{border: '1px solid red', display: 'inline', position: 'relative'}}>
        <a onClick={this.handleOpen} style={{color: 'blue', textDecoration: 'underline'}}>
          Click me
        </a>
        {
          opened && (
            <span style={{position: 'absolute', left: '50%', top: '50%'}}>
              <EditItemPopOver
                title="Edit this item"
                onClose={this.handleClose}
                scrollContainerId="myScrollContainerId"
              >
                {this.props.children}
              </EditItemPopOver>
            </span>
          )
        }
      </span>
    )
  }
}

storiesOf('Edit item')
.add(
  'PopOver',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
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
.add(
  'PopOver (nested)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    return (
      <div style={overflowHidden} id="myScrollContainerId">
        Things is in the background here.
        <Button onClick={action('oh noes! I should not ble clickable!')}>Try click me</Button>
        <EditItemPopOver title="Edit this item" onClose={action('onClose')} scrollContainerId="myScrollContainerId">
          Put your form here
          <EditItemPopOver title="Edit this item" onClose={action('onClose')} scrollContainerId="myScrollContainerId">
            Put your form here
            <EditItemPopOver title="Edit this item" onClose={action('onClose')} scrollContainerId="myScrollContainerId">
              Put your form here
              <EditItemPopOver title="Edit this item" onClose={action('onClose')} scrollContainerId="myScrollContainerId">
                Put your form here
              </EditItemPopOver>
            </EditItemPopOver>
          </EditItemPopOver>
        </EditItemPopOver>
      </div>
    )
  },
  {
    propTables: [EditItemPopOver],
    role: 'part:@sanity/components/edititem/popover'
  }
)
.add(
  'PopOver (Full Width)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
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

.add(
  'PopOver (position test)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
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

.add(
  'PopOver (position test with content)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
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
.add(
  'PopOver (position test a lot content)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    return (
      <div style={overflowScroll} id="myScrollContainerId">
        <Mover>
          <EditItemPopOver title="Edit this item" onClose={action('onClose')} scrollContainerId="myScrollContainerId">
            <h2>{chance.sentence()}</h2>
            <p>{chance.paragraph({sentences: 5})}</p>
            <h2>{chance.sentence()}</h2>
            <p>{chance.paragraph({sentences: 5})}</p>
            <h2>{chance.sentence()}</h2>
            <p>{chance.paragraph({sentences: 5})}</p>
            <h2>{chance.sentence()}</h2>
            <p>{chance.paragraph({sentences: 5})}</p>
            <h2>{chance.sentence()}</h2>
            <p>{chance.paragraph({sentences: 5})}</p>
            <h2>{chance.sentence()}</h2>
            <p>{chance.paragraph({sentences: 5})}</p>
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

.add(
  'PopOver (position test Full Width)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
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


.add(
  'PopOver (test inline)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    return (
      <div id="myScrollContainerId" style={overflowScroll}>
        {
          range(50).map(i => {
            return (
              <p key={i}>
                {chance.paragraph({sentences: random(5, 20)})}
                <EditItemPopOverComponent onClose={action('onClose')}>
                  Some content, and there is more.
                  {chance.paragraph({sentences: random(2, 10)})}
                  <EditItemPopOverComponent onClose={action('onClose')}>
                    Some content, and there is more.
                    {chance.paragraph({sentences: random(1, 20)})}
                    <EditItemPopOverComponent onClose={action('onClose')}>
                      Last content
                      {chance.paragraph({sentences: random(5, 20)})}
                    </EditItemPopOverComponent>
                  </EditItemPopOverComponent>
                </EditItemPopOverComponent>
              </p>
            )
          })
        }
      </div>
    )
  },
  {
    propTables: [EditItemPopOver],
    role: 'part:@sanity/components/edititem/popover'
  }
)


.add(
  'PopOver (test inline offsetContainer)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    return (
      <div id="myScrollContainerId" style={overflowScrollOffset}>
        {
          range(50).map(i => {
            return (
              <p key={i}>
                {chance.paragraph({sentences: random(5, 20)})}
                <EditItemPopOverComponent onClose={action('onClose')}>
                  Some content, and there is more.
                  {chance.paragraph({sentences: random(2, 10)})}
                  <EditItemPopOverComponent onClose={action('onClose')}>
                    Some content, and there is more.
                    {chance.paragraph({sentences: random(1, 20)})}
                    <EditItemPopOverComponent onClose={action('onClose')}>
                      Last content
                      {chance.paragraph({sentences: random(5, 20)})}
                    </EditItemPopOverComponent>
                  </EditItemPopOverComponent>
                </EditItemPopOverComponent>
              </p>
            )
          })
        }
      </div>
    )
  },
  {
    propTables: [EditItemPopOver],
    role: 'part:@sanity/components/edititem/popover'
  }
)


.add(
  'PopOver (inline offsetContainer, scrolled)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    return (
      <div
        id="myScrollContainerId"
        style={{
          height: '150vh',
          width: '80vw',
          position: 'relative',
          top: '10vh',
          left: '10vw',
          overflowY: 'scroll',
          overflowX: 'visible',
          boxSizing: 'border-box',
          border: '5px solid red'
        }}
      >
        {
          range(50).map(i => {
            return (
              <p key={i}>
                {chance.paragraph({sentences: random(5, 20)})}
                <EditItemPopOverComponent onClose={action('onClose')}>
                  Some content, and there is more.
                  {chance.paragraph({sentences: random(2, 10)})}
                  <EditItemPopOverComponent onClose={action('onClose')}>
                    Some content, and there is more.
                    {chance.paragraph({sentences: random(1, 20)})}
                    <EditItemPopOverComponent onClose={action('onClose')}>
                      Last content
                      {chance.paragraph({sentences: random(5, 20)})}
                    </EditItemPopOverComponent>
                  </EditItemPopOverComponent>
                </EditItemPopOverComponent>
              </p>
            )
          })
        }
      </div>
    )
  },
  {
    propTables: [EditItemPopOver],
    role: 'part:@sanity/components/edititem/popover'
  }
)

.add(
  'PopOver (scrolled inside scrolled)',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    return (
      <div
        style={{
          height: '150vh',
          width: '80vw',
          position: 'relative',
          top: '10vh',
          left: '10vw',
          overflowY: 'scroll',
          overflowX: 'visible',
          boxSizing: 'border-box',
          border: '5px solid red'
        }}
      >
        <div
          id="myScrollContainerId"
          scrollTop="200"
          style={{
            height: '100%',
            width: '100%',
            position: 'relative',
            overflowY: 'scroll',
            overflowX: 'visible',
            boxSizing: 'border-box',
            border: '5px solid green'
          }}
        >
          {
            range(50).map(i => {
              return (
                <p key={i}>
                  {chance.paragraph({sentences: random(5, 20)})}
                  <EditItemPopOverComponent onClose={action('onClose')}>
                    Some content, and there is more.
                    {chance.paragraph({sentences: random(2, 10)})}
                    <EditItemPopOverComponent onClose={action('onClose')}>
                      Some content, and there is more.
                      {chance.paragraph({sentences: random(1, 20)})}
                      <EditItemPopOverComponent onClose={action('onClose')}>
                        Last content
                        {chance.paragraph({sentences: random(5, 20)})}
                      </EditItemPopOverComponent>
                    </EditItemPopOverComponent>
                  </EditItemPopOverComponent>
                </p>
              )
            })
          }
        </div>
      </div>
    )
  },
  {
    propTables: [EditItemPopOver],
    role: 'part:@sanity/components/edititem/popover'
  }
)
