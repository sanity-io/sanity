import Chance from 'chance'
import {range} from 'lodash'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean} from 'part:@sanity/storybook/addons/knobs'
import DialogContent from 'part:@sanity/components/dialogs/content'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import {PortalProvider} from 'part:@sanity/components/portal'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React, {useEffect, useRef} from 'react'

const chance = new Chance()

const dialogTestContent = {
  minimal: 'minimal',
  paragraph: 'paragraph',
  longtext: 'longtext',
  example: 'example with dialogcontent'
}

const paragraph = chance.paragraph()
const paragraphs = range(0, 20).map(i => <p key={i}>{chance.paragraph()}</p>)

function renderFullscreenContent(type) {
  switch (type) {
    case 'paragraph':
      return <p>{paragraph}</p>
    case 'longtext':
      return <div>{paragraphs}</div>
    case 'example':
      return (
        <DialogContent size="medium" padding={false}>
          <h1>With dialog content</h1>
          <p>{paragraph}</p>
        </DialogContent>
      )
    default:
      return 'Minimal'
  }
}

export function FullscreenStory() {
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
  const contentTest = select('content', dialogTestContent, 'minimal')
  return (
    <Sanity part="part:@sanity/components/dialogs/fullscreen" propTables={[FullscreenDialog]}>
      <DialogExample
        title={text('title', undefined, 'props')}
        onClose={boolean('Has onClose', false, 'test') && action('onClose')}
        centered={boolean('centered', false, 'props')}
        color={select(
          'Color',
          ['default', 'danger', 'success', 'info', 'warning'],
          undefined,
          'props'
        )}
        actions={dialogActions}
        onAction={action('onAction')}
      >
        {contentTest && renderFullscreenContent(contentTest)}
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
    return () => document.body.removeChild(portalRef.current)
  }, [])

  return (
    <PortalProvider element={portalRef.current}>
      <FullscreenDialog {...restProps}>{children}</FullscreenDialog>
    </PortalProvider>
  )
}
