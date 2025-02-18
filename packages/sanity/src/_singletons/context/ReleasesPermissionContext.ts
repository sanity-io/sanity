import {createContext} from 'sanity/_createContext'

export interface ReleasePermissionsValue {
  checkWithPermissionGuard: <T extends (...args: any[]) => Promise<void> | void>(
    action: T,
    ...args: Parameters<T>
  ) => Promise<boolean>
  permissions: Record<string, boolean>
}

/**
 * @internal
 */
export const ReleasesPermissionsContext = createContext<ReleasePermissionsValue | null>(
  'sanity/_singletons/context/releases-permissions',
  null,
)
