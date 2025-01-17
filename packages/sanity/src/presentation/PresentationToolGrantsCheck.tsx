import {
  schemaIdSingleton,
  schemaType,
  schemaTypeSingleton,
} from '@sanity/preview-url-secret/constants'
import {useToast} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useEffect, useState} from 'react'
import {type PermissionCheckResult, type Tool, useGrantsStore, useTranslation} from 'sanity'

import {presentationLocaleNamespace} from './i18n'
import {PresentationSpinner} from './PresentationSpinner'
import PresentationTool from './PresentationTool'
import {type PresentationPluginOptions} from './types'
import {useVercelBypassSecret} from './useVercelBypassSecret'

export default function PresentationToolGrantsCheck(props: {
  tool: Tool<PresentationPluginOptions>
}): React.JSX.Element {
  const {t} = useTranslation(presentationLocaleNamespace)
  const {previewUrl} = props.tool.options ?? {}
  const {push: pushToast} = useToast()
  const willGeneratePreviewUrlSecret =
    typeof previewUrl === 'object' || typeof previewUrl === 'function'
  const grantsStore = useGrantsStore()
  const [previewAccessSharingCreatePermission, setCreateAccessSharingPermission] =
    useState<PermissionCheckResult | null>(null)
  const [previewAccessSharingUpdatePermission, setUpdateAccessSharingPermission] =
    useState<PermissionCheckResult | null>(null)
  const [previewAccessSharingReadPermission, setReadAccessSharingPermission] =
    useState<PermissionCheckResult | null>(null)
  const [previewUrlSecretPermission, setPreviewUrlSecretPermission] =
    useState<PermissionCheckResult | null>(null)

  useEffect(() => {
    if (!willGeneratePreviewUrlSecret) return undefined

    const previewCreateAccessSharingPermissionSubscription = grantsStore
      .checkDocumentPermission('create', {_id: schemaIdSingleton, _type: schemaTypeSingleton})
      .subscribe(setCreateAccessSharingPermission)
    const previewUpdateAccessSharingPermissionSubscription = grantsStore
      .checkDocumentPermission('update', {_id: schemaIdSingleton, _type: schemaTypeSingleton})
      .subscribe(setUpdateAccessSharingPermission)
    const previewReadAccessSharingPermissionSubscription = grantsStore
      .checkDocumentPermission('read', {_id: schemaIdSingleton, _type: schemaTypeSingleton})
      .subscribe(setReadAccessSharingPermission)
    const previewUrlSecretPermissionSubscription = grantsStore
      .checkDocumentPermission('create', {_id: `drafts.${uuid()}`, _type: schemaType})
      .subscribe(setPreviewUrlSecretPermission)

    return () => {
      previewCreateAccessSharingPermissionSubscription.unsubscribe()
      previewUpdateAccessSharingPermissionSubscription.unsubscribe()
      previewReadAccessSharingPermissionSubscription.unsubscribe()
      previewUrlSecretPermissionSubscription.unsubscribe()
    }
  }, [grantsStore, willGeneratePreviewUrlSecret])

  const canCreateUrlPreviewSecrets = previewUrlSecretPermission?.granted

  useEffect(() => {
    if (!willGeneratePreviewUrlSecret || canCreateUrlPreviewSecrets !== false) return undefined
    const raf = requestAnimationFrame(() =>
      pushToast({
        closable: true,
        status: 'error',
        duration: 30_000,
        title: t('preview-url-secret.missing-grants'),
      }),
    )
    return () => cancelAnimationFrame(raf)
  }, [canCreateUrlPreviewSecrets, pushToast, t, willGeneratePreviewUrlSecret])

  const [vercelProtectionBypass, vercelProtectionBypassReadyState] = useVercelBypassSecret()

  if (
    vercelProtectionBypassReadyState === 'loading' ||
    (willGeneratePreviewUrlSecret &&
      (!previewAccessSharingCreatePermission ||
        typeof previewAccessSharingCreatePermission.granted === 'undefined' ||
        !previewAccessSharingUpdatePermission ||
        typeof previewAccessSharingUpdatePermission.granted === 'undefined' ||
        !previewUrlSecretPermission ||
        !previewAccessSharingReadPermission ||
        typeof previewAccessSharingReadPermission.granted === 'undefined' ||
        typeof previewUrlSecretPermission.granted === 'undefined'))
  ) {
    return <PresentationSpinner />
  }

  return (
    <PresentationTool
      {...props}
      vercelProtectionBypass={vercelProtectionBypass}
      canCreateUrlPreviewSecrets={canCreateUrlPreviewSecrets === true}
      canToggleSharePreviewAccess={
        previewAccessSharingCreatePermission?.granted === true &&
        previewAccessSharingUpdatePermission?.granted === true
      }
      canUseSharedPreviewAccess={previewAccessSharingReadPermission?.granted === true}
    />
  )
}
