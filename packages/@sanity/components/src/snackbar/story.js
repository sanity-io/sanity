import React from 'react'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, select, text, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const getKinds = () => select('Kind', ['default', 'success', 'error', 'warning', 'info'], 'default')

storiesOf('Snackbar')
.addDecorator(withKnobs)
.add(
  'Snackbar',
  () => (
    <Sanity part="part:@sanity/components/snackbar/default" propTables={[Snackbar]}>
      <Snackbar
        kind={getKinds()}
        time={number('time in sec', 500)}
      >
        {text('content', 'This is the content')}
      </Snackbar>
    </Sanity>
  )
)
.add(
  'With action',
  () => {
    const myAction = {
      title: text('action title', 'Press me before i go'),
      action: () => action('Action fired!')
    }
    return (
      <Sanity part="part:@sanity/components/snackbar/default" propTables={[Snackbar]}>
        <Snackbar
          action={myAction}
          time={number('time in sec', 500)}
        >
          {text('content', 'This is the content')}
        </Snackbar>
      </Sanity>
    )
  }
)
