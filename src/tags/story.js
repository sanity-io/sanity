import React, {PropTypes} from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'
import TagsTextField from 'component:@sanity/components/tags/textfield'

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
.addWithInfo(
  'Tags',
  `
    Default tags
  `,
  () => {
    const tags = ['Test', 'Sanity']

    return (
      <TagsTextField
        label="Tags"
        placeholder="This is the placeholder"
        tags={tags}
        onAddTag={action('onAddTag')}
        onRemoveTag={action('onRemoveTag')}
      />
    )
  },
  {
    propTables: [TagsTextField],
    role: 'component:@sanity/components/tags/textfield'
  }
)

.addWithInfo(
  'Tags (test)',
  `
    Default tags
  `,
  () => {
    let tags = ['Test', 'Sanity', 'React', 'Computer', 'Macbook', 'Awesome', 'Windows', 'CPU', 'Moore', 'Intel', 'Ada', 'Enigma']

    return (
      <DefaultTextFieldTagsImplementation tags={tags} />
    )
  },
  {
    propTables: [TagsTextField],
    role: 'component:@sanity/components/tags/textfield'
  }
)
