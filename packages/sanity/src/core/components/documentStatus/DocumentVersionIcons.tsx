import {Card, Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'

import {RhombusIcon} from '../../components/temporary-icons/Rhombus'
import {ReleaseAvatar} from '../../releases/components/ReleaseAvatar'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useWorkspace} from '../../studio/workspace'
import {useAllVariants} from '../../variants/store/useAllVariants'
import {variantIconCard} from './DocumentVersionIcons.css'
import {getReleasePerspective} from './getReleasePerspective'

/**
 * Renders the variant rhombus (when the version belongs to a named variant) and the release
 * avatar that matches the version's bundle — published, draft, a release, or an anonymous
 * bundle. Looks up the release document and variant definition from the version stub.
 *
 * @internal
 */
export function DocumentVersionIcons({version}: {version: VersionInfoDocumentStub}) {
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)
  const {data: releases} = useActiveReleases()
  const {byId: variantsById} = useAllVariants()

  const release = useMemo(() => {
    const releaseRef = version._system.release?._ref
    return releaseRef ? releases.find((candidate) => candidate._id === releaseRef) : undefined
  }, [releases, version._system.release?._ref])

  const variant = version._system.variant?._ref
    ? variantsById.get(version._system.variant._ref)
    : undefined

  return (
    <Flex align="center" flex="none" gap={1}>
      {variantsEnabled && variant ? (
        <Card className={variantIconCard} tone="suggest">
          <Text size={2}>
            <RhombusIcon />
          </Text>
        </Card>
      ) : null}
      <ReleaseAvatar
        fontSize={2}
        size="small"
        release={getReleasePerspective({release, version})}
        padding={0}
      />
    </Flex>
  )
}
