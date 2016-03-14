import React from 'react'

const styles = {
  background: '#c0392b',
  color: '#ecf0f1',
  padding: '10px'
}

export function getUnfulfilledRoleComponent({isRequired, name}) {
  const required = typeof isRequired === 'undefined' ? true : isRequired

  return React.createClass({
    displayName: `UnfulfilledRole(${name})`,

    render() {
      return required
        ? <div style={styles}>Unfulfilled role `{name}`</div>
        : null
    }
  })
}
