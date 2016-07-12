import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Fieldset from 'component:@sanity/components/fieldsets/default'
import DefaultTextField from 'component:@sanity/components/textfields/default'
import SearchTextField from 'component:@sanity/components/textfields/search'

import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'

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
