import React from 'react'

const EXTRA_STYLE = {
  height: '25px',
  fontSize: '10px',
  fontWeight: '600',
  lineHeight: '25px',
  display: 'inline-block',
  verticalAlign: 'top',
  background: '#fe0',
  width: '25px',
  textAlign: 'center',
  borderRadius: '50%'
}

function ensureArray(val) {
  return Array.isArray(val) ? val : [val]
}

export default function AvatarStack(props) {
  const {children: childrenProp, maxLength = 1, ...restProps} = props

  const children = ensureArray(childrenProp)
  const avatars = children.slice(0, maxLength)
  const extraLen = Math.max(children.length - avatars.length, 0)
  return (
    <div {...restProps} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
      {avatars}
      {extraLen > 0 && <div style={{...EXTRA_STYLE}}>+{extraLen}</div>}
    </div>
  )
}
