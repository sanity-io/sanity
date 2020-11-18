import React from 'react'
import Snackbar from 'part:@sanity/components/snackbar/item'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, boolean} from 'part:@sanity/storybook/addons/knobs'

const globalDefaults = {
  offset: 10,
  isOpen: true,
  id: new Date().getTime() + Math.floor(Math.random()),
  setFocus: false,
  onClose: action('onClose()'),
  onDismiss: action('onDismiss()'),
}

export function StackedStory() {
  return (
    <>
      <Snackbar
        {...globalDefaults}
        kind="info"
        title={text('title', 'This is a title placeholder', 'props')}
        isCloseable={boolean('isCloseable', true, 'props')}
        icon
        onSetHeight={action('onSetheight')}
      />
      <Snackbar
        {...globalDefaults}
        offset={75}
        kind="warning"
        title={text('title', 'This is a title placeholder', 'props')}
        isCloseable={boolean('isCloseable', true, 'props')}
        icon
        onSetHeight={action('onSetheight')}
      />
      <Snackbar
        {...globalDefaults}
        offset={140}
        kind="success"
        title={text('title', 'This is a title placeholder', 'props')}
        isCloseable={boolean('onClose', true, 'props')}
        onSetHeight={action('onSetheight')}
      />
    </>
  )
}
