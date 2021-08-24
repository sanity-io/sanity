import React from 'react'

export default class SomeChild extends React.Component {
  state = {random: Math.random()}
  handleClick = (e) => {
    e.preventDefault()
    this.setState({random: Math.random()})
  }
  render() {
    return (
      <span>
        Hello #{this.state.random}
        <button type="button" onClick={this.handleClick}>
          Click to update state of child
        </button>
      </span>
    )
  }
}
