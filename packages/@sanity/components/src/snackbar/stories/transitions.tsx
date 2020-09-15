import React from 'react'
import PropTypes from 'prop-types'
import {action} from 'part:@sanity/storybook/addons/actions'
import {select, text, button, boolean, number} from 'part:@sanity/storybook/addons/knobs'
import {SnackbarItemProps} from '../SnackbarItem'

interface SnackQueueProps {
  snack: SnackbarItemProps
}

const globalDefaults: Omit<SnackbarItemProps, 'onSetHeight'> = {
  offset: 10,
  isOpen: true,
  id: new Date().getTime() + Math.floor(Math.random()),
  setFocus: false,
  onClose: action('onClose()'),
  onDismiss: action('onDismiss()')
}

// @todo: refactor to functional component
class SnackQueue extends React.PureComponent<SnackQueueProps> {
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

export function TransitionsStory() {
  const snack: SnackbarItemProps = {
    ...globalDefaults,
    kind: select('Kinds', ['info', 'success', 'warning', 'error'], 'info', 'props'),
    title: text('Title', 'This is a title placeholder', 'props'),
    subtitle: text('Subtitle', 'This is a subtitle placeholder', 'props'),
    setAutoFocus: boolean('setAutoFocus', false, 'props'),
    isPersisted: boolean('isPersisted', false, 'props'),
    autoDismissTimeout: number('autoDismissTimeout (ms)', 4000, 'props'),
    icon: boolean('Icon', false, 'props'),
    action: {title: text('Action title', ''), callback: action('callback()')},
    isCloseable: boolean('isCloseable', false, 'props'),
    onClose: action(text('onClose', 'Custom onClose', 'props')),
    onSetHeight: action(text('onSetHeight', 'onSetHeight', 'props')),
    children: text('children', 'This is a children placeholder', 'props')
  }

  return <SnackQueue snack={snack} />
}
