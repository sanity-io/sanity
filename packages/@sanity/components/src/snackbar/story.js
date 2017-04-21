import React from 'react'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, select, text, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const getKinds = () => select('Kind', ['success', 'error', 'warning', 'info'])

storiesOf('Snackbar')
.addDecorator(withKnobs)
.add(
  'Snackbar',
  () => (
    <Sanity part="part:@sanity/components/snackbar/default" propTables={[Snackbar]}>
      <Snackbar
        kind={getKinds()}
        timeout={number('timeout after (sec)', 500)}
      >
        {text('content', 'This is the content')}
      </Snackbar>
    </Sanity>
  )
)
.add(
  'With action',
  () => {
    return (
      <Sanity part="part:@sanity/components/snackbar/default" propTables={[Snackbar]}>
        <Snackbar
          kind={getKinds()}
          action={{
            title: text('action title', 'OK, got it')
          }}
          onAction={action('onAction fired!')}
          timeout={number('timeout after (sec)', 500)}
        >
          {text('content', 'This is the content')}
        </Snackbar>
      </Sanity>
    )
  }
)
