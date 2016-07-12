import React from 'react'
import {configure, setAddon, addDecorator} from 'component:@sanity/storybook'

const roleStyle = {
  'position': 'absolute',
  'top': '0',
  'left': '50%',
  'transform': 'translateX(-50%)',
  'font-size': '0.8rem',
  'padding': '0.25rem 1rem',
  'background-color': '#eee',
  'border-radius': '0 0 5px 5px',
  'border': '1px solid #ccc',
  'border-top': 0
}

const codeStyle = {
  'margin-left': '0.5rem',
  'font-family': 'courier, monospace'
}

setAddon({
  addWithRole(storyName, info, role, storyFn) {
    // addDecorator(story => (
    //   <div>
    //     <div style={roleStyle}>
    //       <b>ROLE:</b>
    //       <code style={codeStyle}>{role}</code>
    //     </div>
    //     <div>
    //       {story()}
    //     </div>
    //   </div>
    // ))
    this.addWithInfo(storyName, info, context => {
      return (
        <div>
          <div style={roleStyle}>
            <b>ROLE:</b>
            <code style={codeStyle}>{role}</code>
          </div>
          <div>
            {storyFn(context)}
          </div>
        </div>
      )
    })
  }
})
