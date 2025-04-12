import {TrashIcon} from '@sanity/icons'
import {type Asset as AssetType} from '@sanity/types'
import {Box, Stack} from '@sanity/ui'
import {useMemo} from 'react'

import {Dialog} from '../../../../../ui-components'
import {LoadingBlock} from '../../../../components/loadingBlock'
import {useLegacyReferringDocuments} from '../../../../hooks/useReferringDocuments'
import {useTranslation} from '../../../../i18n'
import {AssetUsageList} from './AssetUsageList'
import {ConfirmMessage} from './ConfirmMessage'

export interface UsageDialogProps {
  assetType: 'file' | 'image'
  asset: AssetType
  isDeleting?: boolean
  onClose: () => void
  onDelete: () => void
}

export function AssetDeleteDialog({
  asset,
  assetType,
  isDeleting = false,
  onClose,
  onDelete,
}: UsageDialogProps) {
  const {isLoading, referringDocuments} = useLegacyReferringDocuments(asset._id)

  const publishedDocuments = useMemo(() => {
    const drafts = referringDocuments.reduce<string[]>(
      (acc, doc) => (doc._id.startsWith('drafts.') ? acc.concat(doc._id.slice(7)) : acc),
      [],
    )

    return referringDocuments.filter((doc) => !drafts.includes(doc._id))
  }, [referringDocuments])

  const hasResults = publishedDocuments.length > 0

  const {t} = useTranslation()

  return (
    <Dialog
      __unstable_autoFocus={isLoading}
      footer={{
        cancelButton: {
          onClick: onClose,
          text: t('asset-source.delete-dialog.action.cancel'),
        },
        confirmButton: {
          disabled: hasResults,
          icon: TrashIcon,
          loading: isDeleting,
          onClick: onDelete,
          text: t('asset-source.delete-dialog.action.delete'),
        },
      }}
      header={t('asset-source.delete-dialog.header', {context: assetType})}
      id="asset-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={1}
    >
      {isLoading ? (
        <Box padding={4}>
          <LoadingBlock showText />
        </Box>
      ) : (
        <Stack
          paddingX={hasResults ? [2, 3, 4] : 0}
          paddingY={hasResults ? [3, 3, 3, 4] : 0}
          space={1}
        >
          <ConfirmMessage asset={asset} assetType={assetType} hasResults={hasResults} />

          {hasResults && (
            <AssetUsageList
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
