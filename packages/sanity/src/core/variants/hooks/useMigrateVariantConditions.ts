import {useToast} from '@sanity/ui/toast'
import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {defer} from 'rxjs'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../i18n'
import {useVariantOperations} from '../store/useVariantOperations'
import {useVariantPermissions} from '../store/useVariantPermissions'
import {useVariantsStore} from '../store/useVariantsStore'
import {type SystemVariant} from '../types'

const NO_VARIANTS: SystemVariant[] = []

/**
 * Migrates variant definitions whose `conditions` are still in the legacy object shape.
 *
 * `hasPermission` is `null` until the permission check (a dry run of the migration) settles.
 * Once migrated, the definitions are marked as such in the variants store right away, without
 * waiting for the listener to report the change.
 *
 * @internal
 */
export function useMigrateVariantConditions(): {
  hasPermission: boolean | null
  isMigrating: boolean
  migrate: (variants: SystemVariant[]) => Promise<void>
} {
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const {migrateVariantConditions} = useVariantOperations()
  const {checkWithPermissionGuard} = useVariantPermissions()
  const {dispatch} = useVariantsStore()
  const [isMigrating, setIsMigrating] = useState(false)

  const hasPermission$ = useMemo(
    () => defer(() => checkWithPermissionGuard(migrateVariantConditions, NO_VARIANTS)),
    [checkWithPermissionGuard, migrateVariantConditions],
  )
  const hasPermission = useObservable(hasPermission$, null)

  const migrate = useCallback(
    async (variants: SystemVariant[]) => {
      const pending = variants.filter((variant) => variant.needsMigration)
      if (pending.length === 0) {
        return
      }

      setIsMigrating(true)
      try {
        await migrateVariantConditions(pending)
        dispatch({type: 'VARIANTS_MIGRATED', payload: {ids: pending.map((variant) => variant._id)}})
        toast.push({
          closable: true,
          status: 'success',
          title: t('migration.success', {count: pending.length}),
        })
      } catch (error) {
        console.error(error)
        toast.push({closable: true, status: 'error', title: t('migration.error.title')})
      }
      setIsMigrating(false)
    },
    [dispatch, migrateVariantConditions, t, toast],
  )

  return {hasPermission, isMigrating, migrate}
}
