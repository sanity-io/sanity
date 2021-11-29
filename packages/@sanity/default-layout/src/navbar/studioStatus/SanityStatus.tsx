import React from 'react'
import {useId} from '@reach/auto-id'
import {PackageIcon} from '@sanity/icons'
import {StatusButton} from '../components'
import CurrentVersionsDialog from './CurrentVersionsDialog'
import UpdateNotifierDialog from './UpdateNotifierDialog'
import type {Package, Severity} from './types'

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
        <StatusButton
          icon={PackageIcon}
          mode="bleed"
          statusTone="primary"
          selected={showDialog}
          aria-label={`${formatUpdateLabel(outdated.length)}, ${severity} severity level.`}
          onClick={onShowDialog}
        />
      )}
    </>
  )
}
