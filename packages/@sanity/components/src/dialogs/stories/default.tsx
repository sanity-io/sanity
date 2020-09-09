import Chance from 'chance'
import {range} from 'lodash'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean} from 'part:@sanity/storybook/addons/knobs'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import {PortalProvider} from 'part:@sanity/components/portal'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React, {useRef, useEffect} from 'react'

const chance = new Chance()

const dialogTestContent = {
  minimal: 'minimal',
  paragraph: 'paragraph',
  longtext: 'longtext',
  example: 'example with dialogcontent'
}

const paragraph = chance.paragraph()
const paragraphs = range(0, 20).map(i => <p key={i}>{chance.paragraph()}</p>)

function renderContent(type) {
  switch (type) {
    case 'paragraph':
      return <p>{paragraph}</p>
    case 'longtext':
      return paragraphs
    case 'example':
      return (
        <DialogContent size="medium" padding="medium">
          <h1>With dialog content</h1>
          <p>{paragraph}</p>
        </DialogContent>
      )
    default:
      return 'Minimal'
  }
}

export function DefaultStory() {
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
  const contentTest = select('content', dialogTestContent, 'minimal')

  return (
    <Sanity part="part:@sanity/components/dialogs/default" propTables={[DefaultDialog]}>
      <DialogExample
        title={text('title', undefined, 'props')}
        color={select(
          'color',
          ['default', 'danger', 'success', 'info', 'warning'],
          undefined,
          'props'
        )}
        showCloseButton={boolean('showCloseButton', false, 'props')}
        onEscape={action('onEscape')}
        onClose={action('onClose')}
        onAction={action('onAction')}
        actions={dialogActions}
      >
        {contentTest && renderContent(contentTest)}
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
