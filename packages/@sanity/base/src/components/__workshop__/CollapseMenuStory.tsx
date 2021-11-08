import React, {useCallback, useMemo, useState} from 'react'
import {Button, Card, Container, useToast} from '@sanity/ui'
import {
  BoldIcon,
  CodeIcon,
  CogIcon,
  ImageIcon,
  ItalicIcon,
  OlistIcon,
  UlistIcon,
  UnderlineIcon,
} from '@sanity/icons'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {CollapseMenu, CollapseMenuButton} from '..'

const GAP_OPTIONS = {'0': 0, '1': 1, '2': 2, '3': 3}

export default function CollapseMenuStory() {
  const {push} = useToast()
  const [selected, setSelected] = useState<string>('')
  const collapseText = useBoolean('Collapse text', true)
  const customMenuButton = useBoolean('Custom menu button', false)
  const gap = useSelect('Gap', GAP_OPTIONS, 1)
  const collapsed = useBoolean('Collapsed', false)
  const disableRestoreFocusOnClose = useBoolean('Disable restore focus on close', false)
  const onMenuClose = useBoolean('onMenuClose', false)

  const handleSelect = useCallback((id: string) => {
    setSelected(id)
  }, [])

  const handleMenuClose = useCallback(() => {
    push({
      title: 'Menu closed',
      status: 'success',
    })
  }, [push])

  const menuButton = useMemo(
    () => (customMenuButton ? <Button tone="primary" icon={CogIcon} /> : undefined),
    [customMenuButton]
  )

  return (
    <Container padding={4} width={4} sizing="border">
      <Card shadow={1} padding={1} radius={3}>
        <CollapseMenu
          collapsed={collapsed}
          gap={gap}
          menuButton={menuButton}
          onMenuClose={onMenuClose ? handleMenuClose : undefined}
          disableRestoreFocusOnClose={disableRestoreFocusOnClose}
        >
          <CollapseMenuButton
            buttonProps={{mode: 'bleed'}}
            collapseText={collapseText}
            icon={BoldIcon}
            onClick={() => handleSelect('bold')}
            selected={selected === 'bold'}
            text="Bold"
          />
          <CollapseMenuButton
            buttonProps={{mode: 'bleed'}}
            collapseText={collapseText}
            icon={ItalicIcon}
            onClick={() => handleSelect('italic')}
            selected={selected === 'italic'}
            text="Italic"
          />
          <CollapseMenuButton
            buttonProps={{mode: 'bleed'}}
            collapseText={collapseText}
            icon={CodeIcon}
            onClick={() => handleSelect('code')}
            selected={selected === 'code'}
            text="Code"
          />
          <CollapseMenuButton
            buttonProps={{mode: 'bleed'}}
            collapseText={collapseText}
            icon={UnderlineIcon}
            onClick={() => handleSelect('underline')}
            selected={selected === 'underline'}
            text="Underline"
          />
          <CollapseMenuButton
            buttonProps={{mode: 'bleed'}}
            collapseText={collapseText}
            dividerBefore
            icon={UlistIcon}
            onClick={() => handleSelect('ulist')}
            selected={selected === 'ulist'}
            text="Ulist"
          />
          <CollapseMenuButton
            buttonProps={{mode: 'bleed'}}
            collapseText={collapseText}
            icon={OlistIcon}
            onClick={() => handleSelect('olist')}
            selected={selected === 'olist'}
            text="Olist"
          />
          <CollapseMenuButton
            buttonProps={{mode: 'bleed'}}
            collapseText={collapseText}
            dividerBefore
            icon={ImageIcon}
            onClick={() => handleSelect('image')}
            selected={selected === 'image'}
            text="Image"
          />
        </CollapseMenu>
      </Card>
    </Container>
  )
}
