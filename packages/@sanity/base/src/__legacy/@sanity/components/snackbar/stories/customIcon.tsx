import Snackbar from 'part:@sanity/components/snackbar/item'
import {action} from 'part:@sanity/storybook/addons/actions'
import {select, text, boolean} from 'part:@sanity/storybook/addons/knobs'
import React from 'react'

const globalDefaults = {
  offset: 10,
  isOpen: true,
  id: new Date().getTime() + Math.floor(Math.random()),
  setFocus: false,
  onClose: action('onClose()'),
  onDismiss: action('onDismiss()'),
}

export function CustomIconStory() {
  return (
    <Snackbar
      {...globalDefaults}
      kind={select('Kind', ['success', 'error', 'warning', 'info'], 'info', 'props')}
      title={text('Title', 'This is a title placeholder', 'props')}
      subtitle={text('Subtitle', '', 'props')}
      icon={text('Icon', '🐈', 'props')}
      isCloseable={boolean('isCloseable', false, 'props')}
      action={{title: text('Action title', 'Action'), callback: action('callback()')}}
      onSetHeight={action('onSetheight')}
    />
  )
}
