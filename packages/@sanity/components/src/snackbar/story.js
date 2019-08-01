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
  onClose: action('onClose(), callback: onDismiss'),
  onDismiss: action('onDismiss()')
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
      title={text('Title', 'This is a title placeholder', 'props')}
      isCloseable={boolean('isCloseable', false, 'props')}
    />
  ))
  .add('Subtitle', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kind', ['success', 'error', 'warning', 'info'], 'info', 'props')}
      title={text('Title', 'This is a title placeholder', 'props')}
      icon={boolean('With icons', false)}
      subtitle={text('Subtitle', 'This is a subtitle placeholder.', 'props')}
      isCloseable={boolean('isCloseable', false, 'props')}
    />
  ))
  .add('Icon', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kind', ['success', 'error', 'warning', 'info'], 'info', 'props')}
      icon
      title={text('title', 'This is a title placeholder', 'props')}
      isCloseable={boolean('isCloseable', false, 'props')}
    />
  ))
  .add('Custom icon', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kind', ['success', 'error', 'warning', 'info'], 'info', 'props')}
      icon={text('Icon', '🐈', 'props')}
      title={text('title', 'This is a title placeholder', 'props')}
      isCloseable={boolean('isCloseable', false, 'props')}
    />
  ))

  .add('Action', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kinds', ['info', 'success', 'warning', 'error'], 'info', 'props')}
      title={text('title', 'This is a title placeholder', 'props')}
      action={{title: text('Action title', 'Action'), callback: action('action.callback()')}}
      isCloseable={boolean('isCloseable', true, 'props')}
    />
  ))
  .add('Custom onClose', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kinds', ['info', 'success', 'warning', 'error'], 'info', 'props')}
      title={text('title', 'This is a title placeholder', 'props')}
      onClose={action(text('onClose', 'Custom onClose', 'props'))}
      isCloseable={boolean('isCloseable', true, 'props')}
    />
  ))
  .add('Stacked', () => (
    <>
      <Snackbar
        {...globalDefaults}
        kind="info"
        title={text('title', 'This is a title placeholder', 'props')}
        isCloseable={boolean('isCloseable', true, 'props')}
        icon
      />
      <Snackbar
        {...globalDefaults}
        offset={75}
        kind="warning"
        title={text('title', 'This is a title placeholder', 'props')}
        isCloseable={boolean('isCloseable', true, 'props')}
        icon
      />
      <Snackbar
        {...globalDefaults}
        offset={140}
        kind="success"
        title={text('title', 'This is a title placeholder', 'props')}
        isCloseable={boolean('onClose', true, 'props')}
      />
    </>
  ))
  .add('With children', () => (
    <Snackbar
      {...globalDefaults}
      kind={select('Kind', ['success', 'error', 'warning', 'info'], 'info', 'props')}
      title={text('title', 'This is a title placeholder', 'props')}
      subtitle={text('Subtitle', 'This is a subtitle placeholder.', 'props')}
    >
      <div>{text('Children', 'This is the children placeholder', 'props')}</div>
    </Snackbar>
  ))
  .add('Transitions', () => {
    const snack = {
      ...globalDefaults,
      kind: select('Kinds', ['info', 'success', 'warning', 'error'], 'info', 'props'),
      title: text('title', 'This is a title placeholder', 'props'),
      setAutoFocus: boolean('setAutoFocus', false, 'props'),
      isPersisted: boolean('isPersisted', false, 'props'),
      autoDismissTimeout: number('autoDismissTimeout (ms)', 4000, 'props'),
      icon: boolean('Icon', false, 'props')
    }
    return <SnackQueue snack={snack} />
  })
