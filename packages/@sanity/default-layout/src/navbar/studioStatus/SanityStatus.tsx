import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import PackageIcon from 'part:@sanity/base/package-icon'
import {useId} from '@reach/auto-id'
import CurrentVersionsDialog from './CurrentVersionsDialog'
import UpdateNotifierDialog from './UpdateNotifierDialog'
import {Package, Severity} from './types'

interface Props {
  isSupported: boolean
  isUpToDate: boolean
  level: Severity
  onHideDialog: () => void
  onShowDialog: () => void
  outdated?: Package[]
  showDialog: boolean
  versions: {[key: string]: string}
}

function formatUpdateLabel(len: number) {
  if (len === 1) return ' 1 update'
  return `${len} updates`
}

export default function SanityStatus(props: Props) {
  const {
    isSupported,
    isUpToDate,
    level,
    onHideDialog,
    onShowDialog,
    outdated = [],
    showDialog,
    versions,
  } = props
  const elementId = useId()
  const currentLevel: Severity = outdated.length ? level : 'notice'
  const severity: Severity = isSupported ? currentLevel : 'high'

  return (
    <>
      {showDialog && (
        <div role="dialog" aria-modal="true" aria-labelledby={elementId}>
          {isUpToDate ? (
            <CurrentVersionsDialog onClose={onHideDialog} versions={versions} />
          ) : (
            <UpdateNotifierDialog onClose={onHideDialog} outdated={outdated} severity={severity} />
          )}
        </div>
      )}
      {!isUpToDate && (
        <Button
          aria-label={`${formatUpdateLabel(outdated.length)}, ${severity} severity level.`}
          icon={PackageIcon}
          iconStatus="primary"
          id={elementId}
          kind="simple"
          onClick={onShowDialog}
          padding="small"
          selected={showDialog}
          tone="navbar"
        />
      )}
    </>
  )
}
