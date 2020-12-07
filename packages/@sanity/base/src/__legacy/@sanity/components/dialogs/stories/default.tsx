import {PortalProvider} from '@sanity/ui'
import Chance from 'chance'
import {range} from 'lodash'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean} from 'part:@sanity/storybook/addons/knobs'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React, {useRef, useEffect} from 'react'

const chance = new Chance()

const paragraph = chance.paragraph()
const paragraphs = range(0, 20).map((i) => <p key={i}>{chance.paragraph()}</p>)

function renderContent(type) {
  switch (type) {
    case 'paragraph':
      return <p>{paragraph}</p>
    case 'longtext':
      return paragraphs
    case 'example':
      return (
        <>
          <h1>With dialog content</h1>
          <p>{paragraph}</p>
        </>
      )
    default:
      return 'Minimal'
  }
}

export function DefaultStory() {
  const actions = boolean('Actions', false, 'test')
    ? [
        {
          index: '1',
          title: 'Finish',
          color: 'primary',
          autoFocus: true,
        },
        {
          index: '2',
          title: 'Cancel',
        },
        {
          index: '3',
          title: 'Secondary',
          color: 'danger',
          secondary: true,
        },
      ]
    : []
  const color = select(
    'Color',
    ['default', 'danger', 'success', 'info', 'warning'],
    undefined,
    'Props'
  )
  const content = select(
    'Content',
    {
      minimal: 'minimal',
      paragraph: 'paragraph',
      longtext: 'longtext',
      example: 'example with dialogcontent',
    },
    'minimal'
  )
  // 'none' | 'small' | 'medium' | 'large'
  const padding =
    select(
      'Padding',
      {
        '': '(undefined)',
        none: 'None',
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
      },
      '',
      'Props'
    ) || undefined
  const showCloseButton = boolean('Show close button', false, 'Props')
  // 'small' | 'medium' | 'large' | 'auto'
  const size =
    select(
      'Size',
      {
        '': '(undefined)',
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        auto: 'Auto',
      },
      '',
      'Props'
    ) || undefined
  const title = text('Title', undefined, 'Props')

  return (
    <Sanity part="part:@sanity/components/dialogs/default" propTables={[DefaultDialog]}>
      <DialogExample
        actions={actions}
        color={color}
        onEscape={action('onEscape')}
        onClose={action('onClose')}
        onAction={action('onAction')}
        padding={padding}
        showCloseButton={showCloseButton}
        size={size}
        title={title}
      >
        {content && renderContent(content)}
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
