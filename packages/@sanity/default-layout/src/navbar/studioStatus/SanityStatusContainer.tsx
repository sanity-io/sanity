import React, {useCallback, useState} from 'react'
import {useCurrentUser, useModuleStatus} from '@sanity/base/hooks'
import SanityStatus from '../studioStatus/SanityStatus'
import {Severity} from './types'

const levels: Severity[] = ['low', 'medium', 'high']

const getHighestLevel = (outdated: {severity?: 'low' | 'medium' | 'high' | 'notice'}[]) =>
  outdated.reduce((acc, pkg) => Math.max(acc, levels.indexOf(pkg.severity || 'low')), 0)

export default function SanityStatusContainer() {
  const [showDialog, setShowDialog] = useState(false)
  const {value: user} = useCurrentUser()
  const {value: moduleStatus} = useModuleStatus()
  const handleHideDialog = useCallback(() => setShowDialog(false), [setShowDialog])
  const handleShowDialog = useCallback(() => setShowDialog(true), [setShowDialog])

  if (!moduleStatus || !user || !user.roles.some((role) => role.name === 'administrator')) {
    return null
  }

  const {outdated, isSupported, isUpToDate, installed} = moduleStatus
  const level = levels[getHighestLevel(outdated || [])]

  return (
    <SanityStatus
      isSupported={isSupported}
      isUpToDate={isUpToDate}
      level={level}
      showDialog={showDialog}
      onHideDialog={handleHideDialog}
      onShowDialog={handleShowDialog}
      outdated={outdated}
      versions={installed}
    />
  )
}
