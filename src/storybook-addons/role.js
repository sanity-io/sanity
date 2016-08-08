import React from 'react'
import {setAddon} from 'component:@sanity/storybook'

const roleStyle = {
  position: 'absolute',
  top: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: '0.8rem',
  padding: '0.25rem 1rem',
  backgroundColor: '#eee',
  borderRadius: '0 0 5px 5px',
  border: '1px solid #ccc',
  borderTop: 0
}

const codeStyle = {
  marginLeft: '0.5rem',
  fontFamily: 'courier, monospace'
}

setAddon({
  addWithRole(storyName, info, role, storyFn) {
    this.addWithInfo(storyName, info, context => {
      return (
        <div>
          <div style={roleStyle}>
            <b>ROLE:</b>
            <code style={codeStyle}>{role}</code>
          </div>
          <div>
            addedWithRole
            {storyFn(context)}
          </div>
        </div>
      )
    })
  }
})
