import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean} from 'part:@sanity/storybook/addons/knobs'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import {PortalProvider} from 'part:@sanity/components/portal'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React, {useEffect, useRef} from 'react'

export function DialogContentStory() {
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
      <DialogExample
        title={text('title', undefined, 'dialog props')}
        color={select(
          'color',
          ['default', 'danger', 'success', 'info', 'warning'],
          undefined,
          'dialog props'
        )}
        onAction={action('onAction')}
        actions={dialogActions}
      >
        <DialogContent
          size={select(
            'size',
            ['default', 'small', 'medium', 'large', 'auto'],
            'default',
            'dialogcontent props'
          )}
          padding={select(
            'padding',
            ['none', 'small', 'medium', 'large'],
            'medium',
            'dialogcontent props'
          )}
        >
          {text('content', 'This is the raw content. use DialogContent to size it', 'props')}
        </DialogContent>
      </DialogExample>
    </Sanity>
  )
}

function DialogExample(props) {
  const {children, ...restProps} = props
  const portalRef = useRef(document.createElement('div'))

  useEffect(() => {
    portalRef.current.setAttribute('data-portal', '')
    document.body.appendChild(portalRef.current)
    return () => {
      document.body.removeChild(portalRef.current)
    }
  }, [])

  return (
    <PortalProvider element={portalRef.current}>
      <DefaultDialog {...restProps}>{children}</DefaultDialog>
    </PortalProvider>
  )
}
