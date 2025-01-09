import {type DefinedTelemetryLog} from '@sanity/telemetry/react'

import {
  ArchivedRelease,
  DeletedRelease,
  UnarchivedRelease,
  UnscheduledRelease,
} from '../../../__telemetry__/releases.telemetry'

export type ReleaseAction = 'archive' | 'unarchive' | 'delete' | 'unschedule'

interface BaseReleaseActionsMap {
  toastSuccessI18nKey: string
  toastFailureI18nKey: string
  telemetry: DefinedTelemetryLog<void>
}

interface DialogActionsMap extends BaseReleaseActionsMap {
  confirmDialog: {
    dialogId: string
    dialogHeaderI18nKey: string
    dialogDescriptionSingularI18nKey: string
    dialogDescriptionMultipleI18nKey: string
    dialogConfirmButtonI18nKey: string
  }
}

export const RELEASE_ACTION_MAP: Record<
  ReleaseAction,
  DialogActionsMap | (BaseReleaseActionsMap & {confirmDialog: false})
> = {
  delete: {
    confirmDialog: {
      dialogId: 'confirm-delete-dialog',
      dialogHeaderI18nKey: 'delete-dialog.confirm-delete.header',
      dialogDescriptionSingularI18nKey: 'delete-dialog.confirm-delete-description_one',
      dialogDescriptionMultipleI18nKey: 'delete-dialog.confirm-delete-description_other',
      dialogConfirmButtonI18nKey: 'delete-dialog.confirm-delete-button',
    },
    toastSuccessI18nKey: 'toast.delete.success',
    toastFailureI18nKey: 'toast.delete.error',
    telemetry: DeletedRelease,
  },
  archive: {
    confirmDialog: {
      dialogId: 'confirm-archive-dialog',
      dialogHeaderI18nKey: 'archive-dialog.confirm-archive-header',
      dialogDescriptionSingularI18nKey: 'archive-dialog.confirm-archive-description_one',
      dialogDescriptionMultipleI18nKey: 'archive-dialog.confirm-archive-description_other',
      dialogConfirmButtonI18nKey: 'archive-dialog.confirm-archive-button',
    },
    toastSuccessI18nKey: 'toast.archive.success',
    toastFailureI18nKey: 'toast.archive.error',
    telemetry: ArchivedRelease,
  },
  unarchive: {
    confirmDialog: false,
    toastSuccessI18nKey: 'toast.unarchive.success',
    toastFailureI18nKey: 'toast.unarchive.error',
    telemetry: UnarchivedRelease,
  },
  unschedule: {
    confirmDialog: false,
    toastSuccessI18nKey: 'toast.unschedule.success',
    toastFailureI18nKey: 'toast.unschedule.error',
    telemetry: UnscheduledRelease,
  },
}
