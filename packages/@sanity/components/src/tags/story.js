import PropTypes from 'prop-types'
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import TagsTextField from 'part:@sanity/components/tags/textfield'
import {withKnobs, array, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

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
.add(
  'Tags',
  () => {
    const tags = ['Test', 'Sanity']

    return (
      <Sanity part="part:@sanity/components/tags/textfield" propTables={[TagsTextField]}>
        <TagsTextField
          label={text('label (prop)', 'Tags')}
          placeholder={text('placeholder (prop)', 'This is the placeholder')}
          value={array('value (prop)', tags)}
          onChange={action('onChange')}
        />
      </Sanity>
    )
  }
)

.add(
  'Tags (test)',
  () => {
    const tags = ['Test', 'Sanity', 'React', 'Computer', 'Macbook', 'Awesome', 'Windows', 'CPU', 'Moore', 'Intel', 'Ada', 'Enigma']

    return (
      <Sanity part="part:@sanity/components/tags/textfield" propTables={[TagsTextField]}>
        <DefaultTextFieldTagsImplementation tags={array('tags (prop)', tags)} />
      </Sanity>
    )
  }
)
