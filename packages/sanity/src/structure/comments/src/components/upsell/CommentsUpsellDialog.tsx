import {useMemo} from 'react'
import styled from 'styled-components'
import {CloseIcon, LaunchIcon} from '@sanity/icons'
import {Box, Stack} from '@sanity/ui'
import {Button, Dialog, DialogProps} from '../../../../../ui-components'
import {CommentsUpsellData} from '../../types'
import {DescriptionSerializer} from 'sanity'
import {CommentsUpsellContent} from './CommentsUpsellContent'

/**
 * Absolute positioned button to close the dialog.
 */
const StyledButton = styled(Button)`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  background: transparent;
  border-radius: 9999px;
  box-shadow: none;
  color: white; // todo: use color from theme
  --card-fg-color: white;
  :hover {
    --card-fg-color: white;
  }
`

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 200px;
`

interface CommentsUpsellDialogProps {
  data: CommentsUpsellData
  onClose: () => void
  onPrimaryClick: () => void
  onSecondaryClick: () => void
}

export function CommentsUpsellDialog(props: CommentsUpsellDialogProps) {
  const {data, onClose, onPrimaryClick, onSecondaryClick} = props

  return (
    <Dialog
      __unstable_hideCloseButton
      bodyHeight="fill"
      id="comments-upsell"
      onClickOutside={onClose}
      onClose={onClose}
      padding={false}
    >
      <StyledButton
        icon={CloseIcon}
        mode="bleed"
        onClick={onClose}
        tabIndex={-1}
        tone="default"
        tooltipProps={null}
      />

      <CommentsUpsellContent
        data={data}
        onPrimaryClick={onPrimaryClick}
        onSecondaryClick={onSecondaryClick}
      />
    </Dialog>
  )
}
