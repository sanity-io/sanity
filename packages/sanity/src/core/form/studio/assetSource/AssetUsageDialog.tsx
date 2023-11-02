import React, {useEffect, useState} from 'react'
import {TrashIcon} from '@sanity/icons'
import {Box, Dialog, Grid, Stack} from '@sanity/ui'
import {Asset as AssetType, SanityDocument} from '@sanity/types'
import {Button} from '../../../../ui'
import {SpinnerWithText} from '../../components/SpinnerWithText'
import {useReferringDocuments} from '../../../hooks/useReferringDocuments'
import {DocumentList} from './DocumentList'
import {ConfirmMessage} from './ConfirmMessage'

export interface UsageDialogProps {
  assetType?: 'file' | 'image'
  mode?: 'listUsage' | 'confirmDelete'
  asset: AssetType
  isDeleting?: boolean
  onClose: () => void
  onDelete: () => void
}

const MODE_CONFIRM_DELETE = 'confirmDelete'
const MODE_LIST_USAGE = 'listUsage'

export function AssetUsageDialog({
  asset,
  assetType = 'image',
  mode = MODE_LIST_USAGE,
  isDeleting = false,
  onClose,
  onDelete,
}: UsageDialogProps) {
  const {isLoading: assetIsLoading, referringDocuments} = useReferringDocuments(asset._id)

  const isListMode = mode === MODE_LIST_USAGE
  const defaultHeaderTitle = isListMode ? `Documents using ${assetType}` : `Delete ${assetType}`
  const [canDelete, setCanDelete] = useState(false)
  const [isLoadingParent, setIsLoadingParent] = useState(true)
  const [publishedDocuments, setPublishedDocuments] = useState<SanityDocument[]>([])
  const showActionFooter = mode === MODE_CONFIRM_DELETE
  const hasResults = publishedDocuments.length > 0
  const showDocumentList = mode === MODE_LIST_USAGE || hasResults
  const noPaddingOnStack = mode === MODE_CONFIRM_DELETE && !hasResults
  const footer = showActionFooter ? (
    <Grid padding={2} gap={2} columns={2}>
      <Button mode="bleed" text="Cancel" onClick={onClose} />
      <Button
        text="Delete"
        tone="critical"
        icon={TrashIcon}
        onClick={onDelete}
        loading={isDeleting}
        disabled={!canDelete}
      />
    </Grid>
  ) : undefined
  useEffect(() => {
    const drafts = referringDocuments.reduce<string[]>(
      (acc, doc) => (doc._id.startsWith('drafts.') ? acc.concat(doc._id.slice(7)) : acc),
      [],
    )

    const documentsWithoutDrafts = referringDocuments.filter((doc) => !drafts.includes(doc._id))

    setPublishedDocuments(documentsWithoutDrafts)
    setCanDelete(documentsWithoutDrafts.length === 0 && !assetIsLoading)
    setIsLoadingParent(assetIsLoading)
  }, [assetIsLoading, referringDocuments])

  return (
    <Dialog
      __unstable_autoFocus={!isLoadingParent}
      footer={footer}
      header={defaultHeaderTitle}
      id="asset-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={1}
    >
      {isLoadingParent && (
        <Box padding={4}>
          <SpinnerWithText text="Loading..." />
        </Box>
      )}

      {!isLoadingParent && (
        <Stack
          paddingX={noPaddingOnStack ? 0 : [2, 3, 4]}
          paddingY={noPaddingOnStack ? 0 : [3, 3, 3, 4]}
          space={1}
        >
          {mode === MODE_CONFIRM_DELETE && (
            <ConfirmMessage asset={asset} assetType={assetType} hasResults={hasResults} />
          )}

          {showDocumentList && (
            <DocumentList
              asset={asset}
              referringDocuments={publishedDocuments}
              assetType={assetType}
            />
          )}
        </Stack>
      )}
    </Dialog>
  )
}
