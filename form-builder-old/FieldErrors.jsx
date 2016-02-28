import React from 'react'

export default React.createClass({
  displayName: 'ValidationResult',
  render() {
    const errors = this.props.errors
    if (!errors) {
      return null
    }
    return (
      <ul className="field-errors">
        {errors.map((error, i) => {
          return (<li key={'error' + i} className="field-error">{error.message}</li>)
        })}
      </ul>
    )
  }
})
