import {useSelector} from '@xstate/react'
import {type Tool} from 'sanity'

import {PresentationSpinner} from './PresentationSpinner'
import PresentationTool from './PresentationTool'
import {type PresentationPluginOptions} from './types'
import {usePreviewUrlActorRef} from './usePreviewUrlActorRef'
import {useReportInvalidPreviewSearchParam} from './useReportInvalidPreviewSearchParam'
import {useVercelBypassSecret} from './useVercelBypassSecret'

export default function PresentationToolGrantsCheck({
  tool,
}: {
  tool: Tool<PresentationPluginOptions>
}): React.JSX.Element {
  const previewUrlRef = usePreviewUrlActorRef(tool.options?.previewUrl, tool.options?.allowOrigins)
  useReportInvalidPreviewSearchParam(previewUrlRef)

  const previewAccessSharingCreatePermission = useSelector(
    previewUrlRef,
    (state) => state.context.previewAccessSharingCreatePermission,
  )
  const previewAccessSharingUpdatePermission = useSelector(
    previewUrlRef,
    (state) => state.context.previewAccessSharingUpdatePermission,
  )
  const previewAccessSharingReadPermission = useSelector(
    previewUrlRef,
    (state) => state.context.previewAccessSharingReadPermission,
  )
  const previewUrlSecretPermission = useSelector(
    previewUrlRef,
    (state) => state.context.previewUrlSecretPermission,
  )
  const url = useSelector(previewUrlRef, (state) => state.context.previewUrl)
  // @TODO the vercel protection bypass can be moved to the iframe level
  const [vercelProtectionBypass, vercelProtectionBypassReadyState] = useVercelBypassSecret()

  if (
    !url ||
    vercelProtectionBypassReadyState === 'loading' ||
    !previewAccessSharingCreatePermission ||
    typeof previewAccessSharingCreatePermission.granted === 'undefined' ||
    !previewAccessSharingUpdatePermission ||
    typeof previewAccessSharingUpdatePermission.granted === 'undefined' ||
    !previewUrlSecretPermission ||
    !previewAccessSharingReadPermission ||
    typeof previewAccessSharingReadPermission.granted === 'undefined' ||
    typeof previewUrlSecretPermission.granted === 'undefined'
  ) {
    return <PresentationSpinner />
  }

  return (
    <PresentationTool
      tool={tool}
      initialPreviewUrl={url}
      vercelProtectionBypass={vercelProtectionBypass}
      canToggleSharePreviewAccess={
        previewAccessSharingCreatePermission?.granted === true &&
        previewAccessSharingUpdatePermission?.granted === true
      }
      canUseSharedPreviewAccess={previewAccessSharingReadPermission?.granted === true}
      previewUrlRef={previewUrlRef}
    />
  )
}
