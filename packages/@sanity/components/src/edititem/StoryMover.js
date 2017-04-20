import React from 'react'
import Draggable from 'react-draggable'

export default class Mover extends React.Component {

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
