import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import TagsTextField from 'component:@sanity/components/tags/textfield'

import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'

class DefaultTextFieldImplementation extends React.Component {

  constructor(...args) {
    super(...args)

    this.addTag = this.addTag.bind(this)
    this.removeTag = this.removeTag.bind(this)

    this.state = {
      tags: this.props.tags
    }
  }

  addTag(tag) {
    action('Add tag')
    const tags = this.state.tags
    tags.push(tag)
    console.log('about to set new state', tags)
    this.setState({
      tags: tags
    })
  }

  removeTag(i) {
    action('Remove tag')
    console.log('Removing tag', this.state.tags[i], i, this.state.tags)

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
.addDecorator(centered)
.addWithRole(
  'Tags',
  `
    Default tags
  `,
  'component:@sanity/components/textfields/tags',
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
  {propTables: [TagsTextField]}
)

.addWithRole(
  'Tags (test)',
  `
    Default tags
  `,
  'component:@sanity/components/textfields/tags',
  () => {
    let tags = ['Test', 'Sanity', 'React', 'Computer', 'Macbook', 'Awesome', 'Windows', 'CPU', 'Moore', 'Intel', 'Ada', 'Enigma']

    return (
      <DefaultTextFieldImplementation tags={tags} />
    )
  },
  {propTables: [TagsTextField]}
)
