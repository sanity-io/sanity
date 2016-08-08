import React, {PropTypes} from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'
import TagsTextField from 'component:@sanity/components/tags/textfield'

class DefaultTextFieldImplementation extends React.Component {
  static propTypes = {
    tags: PropTypes.arrayOf(PropTypes.shape(
      PropTypes.string
    ))
  }
  constructor(...args) {
    super(...args)

    this.addTag = this.addTag.bind(this)
    this.removeTag = this.removeTag.bind(this)

    this.state = {
      tags: this.props.tags || []
    }
  }

  addTag(tag) {
    const tags = this.state.tags
    tags.push(tag)
    this.setState({
      tags: tags
    })
  }

  removeTag(i) {
    this.state.tags.splice(i, 1)
    const tags = this.state.tags

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
        addTag={this.addTag}
        removeTag={this.removeTag}
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
        addTag={action('Add tag')}
        removeTag={action('Remove tag')}
      />
    )
  },
  {
    propTables: [TagsTextField],
    role: 'component:@sanity/components/textfields/tags'
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
      <DefaultTextFieldImplementation tags={tags} />
    )
  },
  {
    propTables: [TagsTextField],
    role: 'component:@sanity/components/textfields/tags'
  }
)
