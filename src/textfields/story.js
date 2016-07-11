import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Fieldset from 'component:@sanity/components/fieldsets/default'
import DefaultTextField from 'component:@sanity/components/textfields/default'
import SearchTextField from 'component:@sanity/components/textfields/search'

storiesOf('Textfields').addWithInfo(
  'Default',
  `
    Default textfield
  `,
  () => {
    return (
      <form>
        <Fieldset legend="This is the legend" description="This is the description">
          <DefaultTextField
            label="This is the label"
            placeholder="This is the placeholder"
          />
        </Fieldset>
      </form>
    )
  },
  {inline: true, propTables: [DefaultTextField]}
)
.addWithInfo(
  'Default (with clear)',
  `
    Default textfield
  `,
  () => {
    return (
      <form>
        <Fieldset legend="This is the legend" description="This is the description">
          <DefaultTextField
            label="This is the label"
            placeholder="This is the placeholder"
            showClearButton
          />
        </Fieldset>
      </form>
    )
  },
  {inline: true, propTables: [DefaultTextField]}
)
.addWithInfo(
  'Default (error)',
  `
    Default textfield
  `,
  () => {
    return (
      <form>
        <Fieldset legend="This is the legend" description="This is the description">
          <DefaultTextField
            label="This is the label"
            placeholder="This is the placeholder"
            showClearButton
            error
          />
        </Fieldset>
      </form>
    )
  },
  {inline: true, propTables: [DefaultTextField]}
)
.addWithInfo(
  'Search',
  `
    Default searchfield
  `,
  () => {
    return (
      <form>
        <SearchTextField
          label="This is the label"
          placeholder="This is the placeholder"
        />
      </form>
    )
  },
  {inline: true, propTables: [SearchTextField]}
)
