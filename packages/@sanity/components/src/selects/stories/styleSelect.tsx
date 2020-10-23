import React from 'react'
import {action} from 'part:@sanity/storybook'
import StyleSelect, {StyleSelectItem} from 'part:@sanity/components/selects/style'
import {boolean, text, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const styleItems: StyleSelectItem[] = [
  {
    title: 'Paragraph',
    key: 'style-paragraph',
  },
  {
    title: 'Heading 1',
    key: 'style-heading1',
  },
  {
    title: 'Heading 2',
    key: 'style-heading2',
  },
  {
    title: 'Heading 3',
    key: 'style-heading3',
  },
  {
    title: 'Heading 4',
    key: 'style-heading4',
  },
  {
    title: 'Heading 5',
    key: 'style-heading5',
  },
]

const centerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
}

const renderStyleItem = function (item) {
  switch (item.key) {
    case 'style-paragraph':
      return <div style={{fontSize: '1em', fontWeight: 'normal'}}>{item.title}</div>
    case 'style-heading1':
      return <div style={{fontSize: '2em', fontWeight: 'bold'}}>{item.title}</div>
    case 'style-heading2':
      return <div style={{fontSize: '1.5em', fontWeight: 'bold'}}>{item.title}</div>
    case 'style-heading3':
      return <div style={{fontSize: '1.2em', fontWeight: 'bold'}}>{item.title}</div>
    default:
      return <div>Style: {item.title}</div>
  }
}

export function StyleSelectStory() {
  return (
    <Sanity part="part:@sanity/components/selects/style" propTables={[StyleSelect]}>
      <div style={centerStyle}>
        <StyleSelect
          placeholder={text('placeholder', 'This is the placeholder', 'props')}
          transparent={boolean('transparent', false, 'props')}
          onChange={action('onChange')}
          onOpen={action('onOpen')}
          padding={select('Padding', ['large', 'default', 'small', 'none'], 'default', 'props')}
          renderItem={renderStyleItem}
          items={styleItems}
        />
      </div>
    </Sanity>
  )
}
