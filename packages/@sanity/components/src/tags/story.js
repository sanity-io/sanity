import PropTypes from 'prop-types'
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import TagsTextField from 'part:@sanity/components/tags/textfield'
import {withKnobs, array, text, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

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

class DefaultTextFieldTagsImplementation extends React.Component {
  static propTypes = {
    tags: PropTypes.arrayOf(PropTypes.string)
  }
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

storiesOf('Tags')
  .addDecorator(withKnobs)
  .add('Tags', () => {
    const tags = ['Test', 'Sanity']

    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/tags/textfield" propTables={[TagsTextField]}>
          <TagsTextField
            label={text('label', 'Tags', 'props')}
            readOnly={boolean('readOnly', false, 'props')}
            placeholder={text('placeholder', 'This is the placeholder', 'props')}
            value={array('value', tags, 'props')}
            onChange={action('onChange')}
          />
        </Sanity>
      </div>
    )
  })

  .add('Tags (test)', () => {
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
  })
