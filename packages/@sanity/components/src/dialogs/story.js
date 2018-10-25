import React from 'react'
import {storiesOf, linkTo} from 'part:@sanity/storybook'
import {withKnobs, text, select, boolean, number} from 'part:@sanity/storybook/addons/knobs'
import Button from 'part:@sanity/components/buttons/default'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import ConfirmDialog from 'part:@sanity/components/dialogs/confirm'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'

const action = actionName => {
  return () => console.log('action', actionName)
}

storiesOf('Dialogs')
  .addDecorator(withKnobs)
  .add('Default', () => {
    const actions = [
      {
        index: '1',
        title: 'Finish',
        color: 'primary',
        autoFocus: true
      },
      {
        index: '2',
        title: 'Cancel'
      },
      {
        index: '3',
        title: 'Secondary',
        color: 'danger',
        secondary: true
      }
    ]

    const dialogActions = boolean('Show actions', false, 'test') ? actions : []

    return (
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[DefaultDialog]}>
        <DefaultDialog
          title={text('title', undefined, 'props')}
          color={select(
            'color',
            ['default', 'danger', 'success', 'info', 'warning'],
            undefined,
            'props'
          )}
          onClose={action('onClose')}
          onAction={action('onAction')}
          actions={dialogActions}
        >
          {text('content', 'This is the raw content. use DialogContent to size it', 'props')}
        </DefaultDialog>
      </Sanity>
    )
  })
  .add('DialogContent', () => {
    const actions = [
      {
        index: '1',
        title: 'Finish',
        color: 'primary',
        autoFocus: true
      },
      {
        index: '2',
        title: 'Cancel'
      },
      {
        index: '3',
        title: 'Secondary',
        color: 'danger',
        secondary: true
      }
    ]

    const dialogActions = boolean('Show actions', false, 'test') ? actions : []

    return (
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[DefaultDialog]}>
        <DefaultDialog
          title={text('title', undefined, 'dialog props')}
          color={select(
            'color',
            ['default', 'danger', 'success', 'info', 'warning'],
            undefined,
            'dialog props'
          )}
          onClose={action('onClose')}
          onAction={action('onAction')}
          actions={dialogActions}
        >
          <DialogContent
            size={select(
              'size',
              ['small', 'medium', 'large', 'auto'],
              undefined,
              'dialogcontent props'
            )}
          >
            {text('content', 'This is the raw content. use DialogContent to size it', 'props')}
          </DialogContent>
        </DefaultDialog>
      </Sanity>
    )
  })

  .add('Fullscreen', () => {
    const actions = [
      {
        index: '1',
        title: 'Default'
      },
      {
        index: '4',
        title: 'Secondary',
        kind: 'simple',
        secondary: true
      }
    ]

    const dialogActions = boolean('Include actions', false, 'test') ? actions : []

    return (
      <Sanity part="part:@sanity/components/dialogs/fullscreen" propTables={[FullscreenDialog]}>
        <FullscreenDialog
          title={text('title', undefined, 'props')}
          onClose={action('onClose')}
          color={select(
            'Color',
            ['default', 'danger', 'success', 'info', 'warning'],
            undefined,
            'props'
          )}
          actions={dialogActions}
          onAction={action('onAction')}
        >
          {text('children', 'This is the content', 'props')}
        </FullscreenDialog>
      </Sanity>
    )
  })

  .add('PopOver', () => {
    const actions = [
      {
        index: '1',
        color: 'success',
        title: 'Please click me',
        autoFocus: true
      }
    ]

    const percentRange = {
      range: true,
      min: 0,
      max: 100,
      step: 0.1
    }

    const left = number('left', 50, percentRange, 'test')
    const top = number('top', 50, percentRange, 'test')
    const refStyles = {
      position: 'absolute',
      top: `${top}%`,
      left: `${left}%`,
      backgroundColor: 'lime'
    }

    if (window) {
      // Triggers update of popper.js (only reacts to scroll and resize by default)
      const event = document.createEvent('HTMLEvents')
      event.initEvent('resize', true, false)
      window.dispatchEvent(event)
    }

    return (
      <Sanity part="part:@sanity/components/dialogs/confirm" propTables={[ConfirmDialog]}>
        <div style={refStyles}>
          <PopOverDialog
            actions={boolean('has actions', false, 'test') ? actions : []}
            color={select('color', [undefined, 'danger', 'default'], undefined, 'props')}
          >
            {text('children', 'PopOver dialog', 'props')}
          </PopOverDialog>
          Reference element
        </div>
      </Sanity>
    )
  })

  .add('Confirm', () => {
    return (
      <Sanity part="part:@sanity/components/dialogs/confirm" propTables={[ConfirmDialog]}>
        <ConfirmDialog
          color={select(
            'color',
            [undefined, 'danger', 'success', 'info', 'warning'],
            undefined,
            'props'
          )}
          confirmColor={select(
            'confirmColor',
            [undefined, 'danger', 'success'],
            undefined,
            'props'
          )}
          cancelColor={select('cancelColor', [undefined, 'danger', 'success'], undefined, 'props')}
          onConfirm={action('onConfirm')}
          onCancel={action('onCancel')}
          confirmButtonText={text('confirmButtonText', 'Yes, delete', 'props')}
          cancelButtonText={text('cancelButtonText', undefined, 'props')}
          title={text('title', undefined, 'props')}
        >
          {text('children', 'Do you really want to?', 'props')}
        </ConfirmDialog>
      </Sanity>
    )
  })
