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

    this.handleAddTag = this.handleAddTag.bind(this)
    this.handleRemoveTag = this.handleRemoveTag.bind(this)

    this.state = {
      tags: this.props.tags || []
    }
  }

  handleAddTag(tag) {
    const tags = this.state.tags.concat()
    tags.push(tag)
    this.setState({
      tags: tags
    })
  }

  handleRemoveTag(i) {
    const tags = this.state.tags.concat()
    tags.splice(i, 1)
    this.setState({
      tags: tags
    })
  }

  render() {
    return (
      <TagsTextField
        label="Tags"
        placeholder="This is the placeholder"
        tags={this.state.tags}
        onAddTag={this.handleAddTag}
        onRemoveTag={this.handleRemoveTag}
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
          label={text('label', 'Tags')}
          placeholder={text('placeholder', 'This is the placeholder')}
          tags={array('tags', tags)}
          onAddTag={action('onAddTag')}
          onRemoveTag={action('onRemoveTag')}
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
        <DefaultTextFieldTagsImplementation tags={array('tags', tags)} />
      </Sanity>
    )
  }
)
