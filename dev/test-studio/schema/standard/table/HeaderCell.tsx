import {TrashIcon} from '@sanity/icons'
import {Button, type Theme} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback} from 'react'
import {type FormPatch} from 'sanity'
import {css, styled} from 'styled-components'

import {getRemoveColumnPatch} from './tablePatches'
import {type Column, type HeaderRow} from './types'

const FloatingButtons = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
  display: none;
  gap: 4px;
`

export const Header = styled.th<{theme: Theme}>((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    padding: ${theme.space[1]}px ${theme.space[0]}px;
    text-align: left;
    border-top: 1px solid ${theme.color.border};
    border-bottom: 1px solid ${theme.color.border};
    border-right: 1px solid ${theme.color.border};
    white-space: nowrap;
    position: relative;
    font-family: ${theme.font.text.family};
    font-size: ${theme.font.text.sizes[0].fontSize}px;
    line-height: ${theme.font.text.sizes[0].lineHeight}px;
    font-weight: ${theme.font.text.weights.medium};
    color: ${theme.color.fg};
    min-width: 180px;
    background: ${theme.color.selectable.neutral.hovered.bg};

    & span[data-border] {
      box-shadow: none !important;
      background: ${theme.color.selectable.neutral.hovered.bg} !important;
    }

    &:hover {
      ${FloatingButtons} {
        display: flex;
      }
    }

    &:first-child {
      border-left: 1px solid ${theme.color.border};
    }
  `
})

export function HeaderCell(props: {
  column: Column
  children: React.ReactNode
  onChange: (patch: FormPatch) => void
  headerRow: HeaderRow
}) {
  const {column, children, onChange, headerRow} = props
  const handleRemoveColumn = useCallback(() => {
    onChange(getRemoveColumnPatch(headerRow, column))
  }, [column, headerRow, onChange])

  return (
    <Header>
      <FloatingButtons>
        <Button
          mode="ghost"
          iconRight={TrashIcon}
          onClick={handleRemoveColumn}
          space={2}
          padding={2}
        />
      </FloatingButtons>
      {children}
    </Header>
  )
}
