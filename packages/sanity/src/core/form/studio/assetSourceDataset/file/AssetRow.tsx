import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {DocumentIcon} from '@sanity/icons/Document'
import {LinkIcon} from '@sanity/icons/Link'
import {TrashIcon} from '@sanity/icons/Trash'
import {type Asset as AssetType} from '@sanity/types'
import {
  // oxlint-disable-next-line no-restricted-imports
  Button,
  Card,
  Flex,
  type FlexProps,
  Grid,
  Stack,
  Text,
} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {clsx} from 'clsx'
import {
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type Subscription} from 'rxjs'
import {Box} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {getHumanFriendlyBytes} from '../../../../field/types/file/diff/helpers'
import {useClient} from '../../../../hooks/useClient'
import {useRelativeTime} from '../../../../hooks/useRelativeTime'
import {useUnitFormatter} from '../../../../hooks/useUnitFormatter'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {AssetDeleteDialog} from '../shared/AssetDeleteDialog'
import {AssetMenu} from '../shared/AssetMenu'
import {AssetUsageDialog} from '../shared/AssetUsageDialog'
import {type AssetMenuAction} from '../types'
import {formatMimeType} from '../utils/mimeType'
import {
  cardIconWrapper,
  customCardSelected,
  customFlex,
  rowButton,
  rowButtonSelected,
  rowButtonUnselected,
  typeText,
} from './AssetRow.css'

interface RowProps {
  isMobile?: boolean
  asset: AssetType
  isSelected?: boolean
  onClick?: (event: MouseEvent) => void
  onKeyPress?: (event: KeyboardEvent) => void
  onDeleteFinished?: (assetId: string) => void
}

/**
 * Both wrappers forward the row's own `onKeyPress` callback (declared on `RowProps`), so they take
 * that prop from `RowProps` rather than from the primitive's DOM attributes.
 */
type CustomFlexProps = Omit<FlexProps, 'onKeyPress'> & Pick<RowProps, 'onKeyPress'>

type RowButtonProps = Omit<ComponentProps<typeof Button<'button'>>, 'onKeyPress'> &
  Pick<RowProps, 'isSelected' | 'onKeyPress'>

function CustomFlex(props: CustomFlexProps) {
  const {className, ...rest} = props
  return <Flex {...rest} className={clsx(customFlex, className)} />
}

function RowButton(props: RowButtonProps) {
  const {className, isSelected, ...rest} = props
  return (
    <Button
      {...rest}
      className={clsx(rowButton, isSelected ? rowButtonSelected : rowButtonUnselected, className)}
    />
  )
}

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

export const AssetRow = (props: RowProps): React.JSX.Element => {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const deleteRef$ = useRef<Subscription>(undefined)
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

  const handleDialogClose = useCallback(() => {
    setShowUsageDialog(false)
    setShowDeleteDialog(false)
  }, [])

  const handleToggleUsageDialog = useCallback(() => {
    setShowUsageDialog(true)
  }, [])

  const handleToggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const handleMenuAction = useCallback(
    (action: AssetMenuAction) => {
      if (action.type === 'delete') {
        handleConfirmDelete()
      }

      if (action.type === 'showUsage') {
        handleToggleUsageDialog()
      }
    },
    [handleConfirmDelete, handleToggleUsageDialog],
  )

  const usageDialog = useMemo(() => {
    return (
      showUsageDialog && (
        <AssetUsageDialog assetType="file" asset={asset} onClose={handleDialogClose} />
      )
    )
  }, [asset, handleDialogClose, showUsageDialog])

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
  }, [asset, handleDeleteAsset, handleDialogClose, isDeleting, showDeleteDialog])

  if (isMobile) {
    return (
      <Card paddingBottom={2} style={STYLES_ROW_CARD}>
        <Grid
          gridTemplateColumns={4}
          gap={1}
          style={{
            position: 'relative',
            gridTemplateColumns: '1fr 30px',
            opacity: isDeleting ? 0.5 : 1,
          }}
        >
          <RowButton
            mode="bleed"
            padding={0}
            data-id={_id}
            onClick={onClick}
            paddingY={1}
            radius={2}
          >
            <Flex gap={2} flex={2} align="center">
              <Card as="span" className={cardIconWrapper} padding={2} tone="transparent" radius={2}>
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
            <Grid marginTop={3} gridTemplateColumns={3} gap={1}>
              <Stack gap={2}>
                <Text size={1} muted weight="medium">
                  {t('asset-source.file.asset-list.header.size')}
                </Text>
                <Text size={1} muted>
                  {formattedSize}
                </Text>
              </Stack>
              <Stack gap={2}>
                <Text size={1} muted weight="medium">
                  {t('asset-source.file.asset-list.header.type')}
                </Text>
                <Text size={1} muted>
                  {formattedMimeType}
                </Text>
              </Stack>
              <Stack gap={2}>
                <Text size={1} muted weight="medium">
                  {t('asset-source.file.asset-list.header.date-added')}
                </Text>
                <Text size={1} muted>
                  {formattedTime}
                </Text>
              </Stack>
            </Grid>
            <Stack gap={2} marginTop={3}>
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
    <Card
      className={isSelected ? customCardSelected : undefined}
      paddingBottom={1}
      style={STYLES_ROW_CARD}
      radius={0}
      overflow={'hidden'}
      aria-selected="true"
    >
      <Grid
        gridTemplateColumns={4}
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
              as="span"
              className={cardIconWrapper}
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
            <Text className={typeText} size={1} muted textOverflow="ellipsis">
              {formattedMimeType}
            </Text>
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
    </Card>
  )
}
