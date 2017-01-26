import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import RadioButton from 'part:@sanity/components/radiobutton/default'

const style = {
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const centered = function (storyFn) {
  return <div style={style}>{storyFn()}</div>
}

const item = {
  title: 'test'
}

storiesOf('Radiobutton')
.addDecorator(centered)
.addWithInfo(
  'Default',
  '',
  () => {
    return (
      <RadioButton name="radioButton" label={item.title} item={item} onChange={action('onChange')} />
    )
  },
  {propTables: [RadioButton], role: 'part:@sanity/components/radiobutton/default'}
)
.addWithInfo(
  'Default checked',
  '',
  () => {
    return (
      <RadioButton name="radioButton" label={item.title} item={item} onChange={action('onChange')} checked />
    )
  },
  {propTables: [RadioButton], role: 'part:@sanity/components/radiobutton/default'}
)
