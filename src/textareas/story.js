import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'
import DefaultTextArea from 'component:@sanity/components/textareas/default'

storiesOf('Text areas')
.addWithInfo(
  'Default',
  `
    Default text area
  `,
  () => {
    return (
      <DefaultTextArea
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onKeyPress={action('onKeyPress')}
        onBlur={action('onBlur')}
        rows={2}
        id="ThisIsAnUniqueIdForTextArea"
      />
    )
  },
  {
    propTables: [DefaultTextArea],
    role: 'component:@sanity/components/textinputs/default'
  }
)
.addWithInfo(
  'Default (10 rows)',
  `
    Default text area
  `,
  () => {
    return (
      <DefaultTextArea
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onKeyPress={action('onKeyPress')}
        onBlur={action('onBlur')}
        rows={10}
        id="ThisIsAnUniqueIdForTextArea"
      />
    )
  },
  {
    propTables: [DefaultTextArea],
    role: 'component:@sanity/components/textinputs/default'
  }
)
