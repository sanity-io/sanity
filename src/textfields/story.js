import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Fieldset from 'component:@sanity/components/fieldsets/default'
import DefaultTextField from 'component:@sanity/components/textfields/default'
import SearchTextField from 'component:@sanity/components/textfields/search'

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
    this.setState({
      tags: this.state.tags.push(tag)
    })
    console.log('adding tag', tag, this.state.tags)
  }

  removeTag(i) {
    action('Remove tag')
    console.log('Removing tag', this.state.tags[i], i, this.state.tags)
    this.setState({
      tags: this.state.tags[i].splice(i, 1)
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



storiesOf('Textfields')
  .addDecorator(centered)
  .addWithRole(
  'Default',
  `
    Default textfield
  `,
  'component:@sanity/components/textfields/default',
  () => {
    return (
      <DefaultTextField
        label="This is the label"
        placeholder="This is the placeholder"
      />
    )
  },
  {propTables: [DefaultTextField]}
)
.addWithRole(
  'Default (with clear)',
  `
    Default textfield
  `,
  'component:@sanity/components/textfields/default',
  () => {
    return (
      <DefaultTextField
        label="This is the label"
        placeholder="This is the placeholder"
        showClearButton
      />
    )
  },
  {propTables: [DefaultTextField]}
)
.addWithRole(
  'Default (error)',
  `
    Default textfield
  `,
  'component:@sanity/components/textfields/default',
  () => {
    return (
      <DefaultTextField
        label="This is the label"
        placeholder="This is the placeholder"
        showClearButton
        error
      />
    )
  },
  {propTables: [DefaultTextField]}
)
.addWithRole(
  'Search',
  `
    Default searchfield
  `,
  'component:@sanity/components/textfields/search',
  () => {
    return (
      <SearchTextField
        label="This is the label"
        placeholder="This is the placeholder"
      />
    )
  },
  {propTables: [SearchTextField]}
)
