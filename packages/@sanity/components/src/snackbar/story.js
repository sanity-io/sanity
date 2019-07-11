import React from 'react'
import PropTypes from 'prop-types'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, select, text, number, button} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import SnackbarProvider from 'part:@sanity/components/snackbar/provider'

const getKinds = () => select('Kind', ['success', 'error', 'warning', 'info'], 'success')

class SnackQueue extends React.PureComponent {
  static propTypes = {
    snack: PropTypes.object
  }
  static contextTypes = {
    addToSnackQueue: PropTypes.func
  }

  addToQueue = () => {
    const {snack} = this.props
    this.context.addToSnackQueue(snack)
  }

  render() {
    button('Add to queue', this.addToQueue, 'test')
    return <div />
  }
}

storiesOf('Snackbar')
  .addDecorator(withKnobs)
  .add('Snackbar', () => (
    <Sanity part="part:@sanity/components/snackbar/default" propTables={[Snackbar]}>
      <Snackbar kind={getKinds()} timeout={number('timeout after (sec)', 500, 'props')}>
        {text('content', 'This is the content')}
      </Snackbar>
    </Sanity>
  ))
  .add('With action', () => {
    return (
      <Sanity part="part:@sanity/components/snackbar/default" propTables={[Snackbar]}>
        <Snackbar
          kind={getKinds()}
          action={{
            title: text('action title', 'OK, got it')
          }}
          onAction={action('onAction')}
          timeout={number('timeout im ms', 500, 'props')}
        >
          {text('children', 'This is the content', 'props')}
        </Snackbar>
      </Sanity>
    )
  })
  .add('Queue', () => {
    const snack = {
      kind: getKinds(),
      message: text('message', 'Message', 'props'),
      children: text('children', 'Children', 'props'),
      onHide: () => action('onHide'),
      onAction: () => action('action'),
      actionTitle: text('actionTitle', 'action', 'props')
    }

    return (
      <SnackbarProvider>
        <SnackQueue snack={snack} />
      </SnackbarProvider>
    )
  })
