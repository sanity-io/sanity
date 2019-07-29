/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import Snackbar from 'part:@sanity/components/snackbar/item'
import {storiesOf, addDecorator} from 'part:@sanity/storybook'
import {withKnobs, select, text, button, boolean, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import SnackbarProvider from 'part:@sanity/components/snackbar/provider'

function action(something) {
  return () => console.log('action:', something)
}
const Provider = storyFn => (
  <Sanity part="part:@sanity/components/snackbar/item" propTables={[Snackbar]}>
    <SnackbarProvider>{storyFn()}</SnackbarProvider>
  </Sanity>
)

const globalDefaults = {
  offset: 10,
  isOpen: true,
  id: new Date().getTime() + Math.floor(Math.random()),
  setFocus: false,
  onAction: action('default onAction, calls onDismiss'),
  onDismiss: action('onDismiss, do nothing onHide')
}

class SnackQueue extends React.PureComponent {
  static propTypes = {
    snack: PropTypes.object
  }
  static contextTypes = {
    addToSnackQueue: PropTypes.func
  }

  addToQueue = () => {
    const {snack} = this.props
    const newSnack = {
      ...snack,
      id: new Date().getTime() + Math.floor(Math.random())
    }
    this.context.addToSnackQueue(newSnack)
  }

  render() {
    button('Add to queue', this.addToQueue, 'test')
    return <div />
  }
}

addDecorator(Provider)
addDecorator(withKnobs)
storiesOf('Snackbar', module)
  .add('Default', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kind', ['success', 'error', 'warning', 'info'], 'info', 'props')}
      message={text('Message', 'This is a message placeholder', 'props')}
    />
  ))
  .add('With children', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kind', ['success', 'error', 'warning', 'info'], 'info', 'props')}
      message={text('Message', 'This is a message placeholder', 'props')}
    >
      <div>{text('Children', 'This is the children placeholder', 'props')}</div>
    </Snackbar>
  ))
  .add('Custom icon', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kind', ['success', 'error', 'warning', 'info'], 'info', 'props')}
      icon="🐈"
      message={text('Message', 'This is a message placeholder', 'props')}
    />
  ))
  .add('Custom action', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kinds', ['info', 'success', 'warning', 'error'], 'info', 'props')}
      message={text('Message', 'This is a message placeholder', 'props')}
      actionTitle={text('actionTitle', 'Custom', 'props')}
      onAction={action(text('onAction', 'Custom onAction', 'props'))}
    />
  ))
  .add('Custom dismiss', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kinds', ['info', 'success', 'warning', 'error'], 'info', 'props')}
      message={text('Message', 'This is a message placeholder', 'props')}
      onDismiss={action(text('onHide', 'Custom onHide', 'props'))}
    />
  ))
  .add('Stacked', () => (
    <>
      <Snackbar
        {...globalDefaults}
        kind="info"
        message={text('Message', 'This is a message placeholder', 'props')}
      />
      <Snackbar
        {...globalDefaults}
        offset={70}
        kind="warning"
        message={text('Message', 'This is a message placeholder', 'props')}
      />
      <Snackbar
        {...globalDefaults}
        offset={130}
        kind="success"
        message={text('Message', 'This is a message placeholder', 'props')}
      />
    </>
  ))
  .add('Transitions', () => {
    const snack = {
      ...globalDefaults,
      kind: select('Kinds', ['info', 'success', 'warning', 'error'], 'info', 'props'),
      message: text('Message', 'This is a message placeholder', 'props'),
      setAutoFocus: boolean('setAutoFocus', false, 'props'),
      isPersisted: boolean('isPersisted', false, 'props'),
      transitionDuration: number('transitionDuration (ms)', 200, 'props'),
      autoDismissTimeout: number('autoDismissTimeout (ms)', 4000, 'props')
    }
    return <SnackQueue snack={snack} />
  })
