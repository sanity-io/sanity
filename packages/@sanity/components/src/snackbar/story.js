import React from 'react'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, select, text, number} from 'part:@sanity/storybook/addons/knobs'

const getKinds = () => select('Kind', ['default', 'success', 'error', 'warning', 'info'], 'default')

storiesOf('Snackbar')
.addDecorator(withKnobs)
.add(
  'Info',
  () => (
    <Snackbar
      kind={getKinds()}
      time={number('time in sec', 500)}
    >
      {text('content', 'This is the content')}
    </Snackbar>
  ),
  {
    propTables: [Snackbar],
    role: 'part:@sanity/components/snackbar/default'
  }
)
.add(
  'With action',
  () => {
    const myAction = {
      title: text('action title', 'Press me before i go'),
      action: () => action('Action fired!')
    }
    return (
      <Snackbar
        action={myAction}
        time={number('time in sec', 500)}
      >
        {text('content', 'This is the content')}
      </Snackbar>
    )
  },
  {
    propTables: [Snackbar],
    role: 'part:@sanity/components/snackbar/default'
  }
)
