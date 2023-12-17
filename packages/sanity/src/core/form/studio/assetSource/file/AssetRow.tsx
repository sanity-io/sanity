import type {Subscription} from 'rxjs'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import styled, {css} from 'styled-components'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button,
  Card,
  Flex,
  Grid,
  Stack,
  Text,
  useToast,
} from '@sanity/ui'
import {ChevronDownIcon, ChevronUpIcon, DocumentIcon, LinkIcon, TrashIcon} from '@sanity/icons'
import {Asset as AssetType} from '@sanity/types'
import {Tooltip} from '../../../../ui-components'
import {useClient, useRelativeTime, useUnitFormatter} from '../../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {AssetDeleteDialog} from '../shared/AssetDeleteDialog'
import {AssetMenu} from '../shared/AssetMenu'
import {AssetMenuAction} from '../types'
import {formatMimeType} from '../utils/mimeType'
import {AssetUsageDialog} from '../shared/AssetUsageDialog'
import {useTranslation} from '../../../../i18n'
import {getHumanFriendlyBytes} from '../../../../field/types/file/diff/helpers'

interface RowProps {
  isMobile?: boolean
  asset: AssetType
  isSelected?: boolean
  onClick?: (event: React.MouseEvent) => void
  onKeyPress?: (event: React.KeyboardEvent) => void
  onDeleteFinished?: (assetId: string) => void
}

const CardIconWrapper = styled.span`
  background-color: transparent;
  flex-shrink: 0;
`

// These are here because using vanilla UI components caused a type issue inside of styled-components
const CustomFlex = styled(Flex)``

const CustomCard = styled(Card)<RowProps>`
  ${(props) =>
    props.isSelected &&
    css`
      --card-muted-fg-color: var(--card-bg-color);
      --card-fg-color: var(--card-bg-color);
    `}
`

const RowButton = styled(Button)<RowProps>`
  box-shadow: none;
  min-width: 0;
  cursor: pointer;
  position: initial;

  &:before,
  &:after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
  }

  &:before {
    z-index: 0;
    pointer-events: none;
    border-radius: inherit;
  }

  ${(props) =>
    props.isSelected &&
    css`
      --card-muted-fg-color: var(--card-bg-color);
      --card-fg-color: var(--card-bg-color);

      &:before {
        background-color: var(--card-focus-ring-color);
      }

      ${CardIconWrapper} {
        --card-muted-fg-color: var(--card-bg-color);
      }

      ${CustomFlex} {
        --card-muted-fg-color: var(--card-bg-color);
        --card-fg-color: var(--card-bg-color);
      }
    `}

  ${(props) =>
    !props.isSelected &&
    css`
      &:hover:before {
        background-color: var(--card-bg-color);
      }

      &:focus:before {
        background-color: var(--card-code-bg-color);
      }

      &:focus-within:before {
        background-color: var(--card-bg-color);
      }
    `}
`

const TypeText = styled(Text)`
  overflow-wrap: anywhere;
`

const STYLES_ROW_CARD = {
  position: 'relative',
} as const

const STYLES_ICON_CARD = {flexShrink: 0}
const STYLES_BUTTON_TEXT = {minWidth: 0}
const STYLES_ASSETMENU_WRAPPER = {
  zIndex: 3,
  marginTop: '-0.5rem',
  marginBottom: '-0.5rem',
}

export const AssetRow = (props: RowProps) => {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const deleteRef$ = useRef<Subscription>()
  const [showUsageDialog, setShowUsageDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const {asset, onClick, onKeyPress, onDeleteFinished, isSelected, isMobile} = props
  const {originalFilename, _id, mimeType, size, _createdAt} = asset
  const formattedTime = useRelativeTime(_createdAt, {useTemporalPhrase: true})
  const formattedMimeType = formatMimeType(mimeType)

  const formatUnit = useUnitFormatter({unitDisplay: 'short', maximumFractionDigits: 2})
  const formattedSize = getHumanFriendlyBytes(size, formatUnit)

  const showTooltip = (originalFilename || '').length > 37

  const {t} = useTranslation()
  const handleConfirmDelete = useCallback(() => {
    setShowDeleteDialog(true)
  }, [])

  const handleDeleteError = useCallback(
    (error: Error) => {
      toast.push({
        closable: true,
        status: 'error',
        title: t('asset-source.file.asset-list.delete-failed'),
        description: error.message,
      })
    },
    [t, toast],
  )

  const handleDeleteSuccess = useCallback(() => {
    toast.push({
      status: 'success',
      title: t('asset-source.file.asset-list.delete-successful'),
    })
  }, [t, toast])

  const handleDeleteAsset = useCallback(() => {
    setIsDeleting(true)

    deleteRef$.current = versionedClient.observable.delete(asset._id).subscribe({
      next: () => {
        setIsDeleting(false)
        onDeleteFinished?.(asset._id)
        setShowDeleteDialog(false)
        handleDeleteSuccess()
      },
      error: (err: Error) => {
        setIsDeleting(false)
        handleDeleteError(err)
        // eslint-disable-next-line no-console
        console.error('Could not delete asset', err)
      },
    })
  }, [
    asset._id,
    handleDeleteError,
    handleDeleteSuccess,
    onDeleteFinished,
    versionedClient.observable,
  ])

  const handleDialogClose = () => {
    setShowUsageDialog(false)
    setShowDeleteDialog(false)
  }

  const handleToggleUsageDialog = () => {
    setShowUsageDialog(true)
  }

  const handleToggleOpen = () => {
    setIsOpen(!isOpen)
  }

  const handleMenuAction = (action: AssetMenuAction) => {
    if (action.type === 'delete') {
      handleConfirmDelete()
    }

    if (action.type === 'showUsage') {
      handleToggleUsageDialog()
    }
  }

  const usageDialog = useMemo(() => {
    return (
      showUsageDialog && (
        <AssetUsageDialog assetType="file" asset={asset} onClose={handleDialogClose} />
      )
    )
  }, [asset, showUsageDialog])

  const deleteDialog = useMemo(() => {
    return (
      showDeleteDialog && (
        <AssetDeleteDialog
          assetType="file"
          asset={asset}
          onClose={handleDialogClose}
          onDelete={handleDeleteAsset}
          isDeleting={isDeleting}
        />
      )
    )
  }, [asset, handleDeleteAsset, isDeleting, showDeleteDialog])

  if (isMobile) {
    return (
      <Card paddingBottom={2} style={STYLES_ROW_CARD}>
        <Grid
          columns={4}
          gap={1}
          style={{
            position: 'relative',
            gridTemplateColumns: '1fr 30px',
            opacity: isDeleting ? 0.5 : 1,
          }}
        >
          <RowButton
            asset={asset}
            mode="bleed"
            padding={0}
            data-id={_id}
            onClick={onClick}
            paddingY={1}
            radius={2}
          >
            <Flex gap={2} flex={2} align="center">
              <Card as={CardIconWrapper} padding={2} tone="transparent" radius={2}>
                <Text muted size={2} style={STYLES_ICON_CARD}>
                  <DocumentIcon />
                </Text>
              </Card>
              <Text size={1} align="left" textOverflow="ellipsis" style={STYLES_BUTTON_TEXT}>
                {originalFilename}
              </Text>
            </Flex>
          </RowButton>
          <Flex justify="flex-end" align="center" paddingRight={1} style={STYLES_ASSETMENU_WRAPPER}>
            <Button
              mode="bleed"
              fontSize={1}
              padding={2}
              onClick={handleToggleOpen}
              icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
            />
          </Flex>
        </Grid>
        {isOpen && (
          <>
            <Grid marginTop={3} columns={3} gap={1}>
              <Stack space={2}>
                <Text size={1} muted weight="medium">
                  {t('asset-source.file.asset-list.header.size')}
                </Text>
                <Text size={1} muted>
                  {formattedSize}
                </Text>
              </Stack>
              <Stack space={2}>
                <Text size={1} muted weight="medium">
                  {t('asset-source.file.asset-list.header.type')}
                </Text>
                <Text size={1} muted>
                  {formattedMimeType}
                </Text>
              </Stack>
              <Stack space={2}>
                <Text size={1} muted weight="medium">
                  {t('asset-source.file.asset-list.header.date-added')}
                </Text>
                <Text size={1} muted>
                  {formattedTime}
                </Text>
              </Stack>
            </Grid>
            <Stack space={2} marginTop={3}>
              <Button
                fontSize={1}
                tone="default"
                mode="ghost"
                text={t('asset-source.file.asset-list.action.show-usage.title')}
                onClick={handleToggleUsageDialog}
                icon={LinkIcon}
              />

              <Button
                fontSize={1}
                tone="critical"
                mode="ghost"
                text={t('asset-source.file.asset-list.action.delete.title')}
                icon={TrashIcon}
                disabled={isSelected}
                title={t(
                  isSelected
                    ? 'asset-source.file.asset-list.action.delete.disabled-cannot-delete-current-file'
                    : 'asset-source.file.asset-list.action.delete.title',
                )}
                onClick={handleConfirmDelete}
              />
            </Stack>
          </>
        )}
        {usageDialog || deleteDialog}
      </Card>
    )
  }

  return (
    <CustomCard
      asset={asset}
      paddingBottom={1}
      style={STYLES_ROW_CARD}
      radius={0}
      overflow={'hidden'}
      isSelected={isSelected}
      aria-selected="true"
    >
      <Grid
        columns={4}
        gap={1}
        data-id={_id}
        paddingY={1}
        style={{
          position: 'relative',
          gridTemplateColumns: '3fr 1fr 1fr 2fr 30px',
          opacity: isDeleting ? 0.5 : 1,
        }}
      >
        <RowButton
          asset={asset}
          mode="bleed"
          data-id={_id}
          onClick={onClick}
          padding={0}
          onKeyPress={onKeyPress}
          title={t('asset-source.file.asset-list.item.select-file-tooltip', {
            filename: originalFilename,
          })}
          isSelected={isSelected}
          radius={2}
        >
          <CustomFlex
            gap={2}
            flex={2}
            paddingRight={1}
            align="center"
            onClick={onClick}
            onKeyPress={onKeyPress}
            data-id={_id}
          >
            <Card
              as={CardIconWrapper}
              padding={2}
              tone="transparent"
              radius={2}
              style={STYLES_ICON_CARD}
            >
              <Text muted size={2}>
                <DocumentIcon />
              </Text>
            </Card>
            {showTooltip && (
              <Tooltip content={originalFilename}>
                <Text size={1} align="left" textOverflow="ellipsis" style={STYLES_BUTTON_TEXT}>
                  {originalFilename}
                </Text>
              </Tooltip>
            )}

            {!showTooltip && (
              <Text size={1} align="left" textOverflow="ellipsis" style={STYLES_BUTTON_TEXT}>
                {originalFilename}
              </Text>
            )}
          </CustomFlex>
        </RowButton>
        <CustomFlex align="center">
          <Text size={1} muted>
            {formattedSize}
          </Text>
        </CustomFlex>
        <CustomFlex align="center">
          <Box>
            <TypeText size={1} muted textOverflow="ellipsis">
              {formattedMimeType}
            </TypeText>
          </Box>
        </CustomFlex>
        <CustomFlex align="center">
          <Text as="time" size={1} muted dateTime={_createdAt}>
            {formattedTime}
          </Text>
        </CustomFlex>
        <CustomFlex
          justify="flex-end"
          align="center"
          paddingX={1}
          paddingY={1}
          style={STYLES_ASSETMENU_WRAPPER}
        >
          <AssetMenu border={false} isSelected={false} onAction={handleMenuAction} />
        </CustomFlex>
      </Grid>
      {usageDialog || deleteDialog}
    </CustomCard>
  )
}
