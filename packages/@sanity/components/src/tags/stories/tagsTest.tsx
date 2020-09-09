import TagsTextField from 'part:@sanity/components/tags/textfield'
import {array} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0
}

class DefaultTextFieldTagsImplementation extends React.PureComponent {
  constructor(...args) {
    super(...args)
    this.state = {
      tags: this.props.tags || []
    }
  }

  handleChange = tags => {
    this.setState({
      tags: tags
    })
  }

  render() {
    return (
      <TagsTextField
        label="Tags"
        placeholder="This is the placeholder"
        value={this.state.tags}
        onChange={this.handleChange}
      />
    )
  }
}

export function TagsTestStory() {
  const tags = [
    'Test',
    'Sanity',
    'React',
    'Computer',
    'Macbook',
    'Awesome',
    'Windows',
    'CPU',
    'Moore',
    'Intel',
    'Ada',
    'Enigma'
  ]

  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/tags/textfield" propTables={[TagsTextField]}>
        <DefaultTextFieldTagsImplementation tags={array('tags', tags, 'props')} />
      </Sanity>
    </div>
  )
}
