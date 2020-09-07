/* eslint-disable import/export */

// import {Observable} from 'rxjs'
type Observable<T> = any

declare module 'part:@sanity/base/login-wrapper?' {
  const Component:
    | React.ComponentType<{
        LoadingScreen: React.ReactNode
      }>
    | undefined
  export default Component
}

declare module 'part:@sanity/base/router' {
  export const IntentLink: React.ComponentType<{
    className?: string
    intent: string
    onClick: (event: React.MouseEvent<HTMLElement>) => void
    onMouseDown?: (event: React.MouseEvent<HTMLElement>) => void
    params: {}
    tabIndex?: number
    title?: string
  }>
  export const RouterProvider: React.ComponentType<{
    router: any
    state: any
    onNavigate: (url: string, options: {replace: boolean}) => void
  }>
  export const RouteScope: React.ComponentType<{scope: string}>
  export const withRouterHOC: (component: React.ComponentType<{}>) => React.ComponentType<{}>
  export const route: (
    pattern: string,
    fn?: any[] | ((params: any) => void)
  ) => {
    decode: (str: string) => {}
    encode: (state: {}) => string
    getRedirectBase: (str: string) => string
    isNotFound: (str: string) => boolean
  }
  export const StateLink: React.ComponentType<{
    className?: string
    onClick?: (event: React.MouseEvent<HTMLElement>) => void
    state: any
    tabIndex?: number
  }>
}

declare module 'part:@sanity/base/app-loading-screen' {
  const AppLoadingScreen: React.ComponentType<{text: React.ReactNode}>
  export default AppLoadingScreen
}

declare module 'all:part:@sanity/base/absolutes' {
  const components: React.ComponentType[]
  export default components
}

declare module 'part:@sanity/base/user' {
  import {UserStore} from '@sanity/base'

  const userStore: UserStore
  export default userStore
}

declare module 'all:part:@sanity/base/tool' {
  const tools: {
    canHandleIntent?: (intent: {}, params: {}, state: {}) => {}
    component?: React.ComponentType<{}>
    getIntentState?: (intent: {}, params: {}, state: {}, payload: {}) => {}
    name: string
    title: string
    router?: {}
  }[]
  export default tools
}

declare module 'config:sanity' {
  const config: {project: {basePath?: string; name?: string}}
  export const project: {basePath?: string; name?: string}

  export default config
}

declare module 'part:@sanity/default-layout/sidecar?' {
  export const isSidecarEnabled: () => boolean | undefined
  export const SidecarLayout: React.ComponentType<{}> | undefined
  export const SidecarToggleButton: React.ComponentType<{}> | undefined
}

declare module 'part:@sanity/default-layout/sidecar-datastore' {
  export const isSidecarOpenSetting: {listen: () => Observable<boolean>}
}

declare module 'part:@sanity/base/settings' {
  const x: {
    forNamespace: (
      key: string
    ) => {
      forKey: (
        key: string
      ) => {
        listen: () => Observable<boolean>
        set: (val: boolean) => void
      }
    }
  }
  export default x
}

declare module 'part:@sanity/base/location' {
  const locationStore: {
    actions: {navigate: (newUrl: string, options: {}) => void}
    state: Observable<any>
  }

  export default locationStore
}

declare module 'part:@sanity/components/avatar' {
  export * from '@sanity/components/src/avatar'
}

declare module 'part:@sanity/components/click-outside' {
  export * from '@sanity/components/src/clickOutside'
}

declare module 'part:@sanity/components/buttons/default-style'
declare module 'part:@sanity/components/buttons/default' {
  export {default} from '@sanity/components/src/buttons/DefaultButton'
}
declare module 'part:@sanity/components/buttons/state' {
  export {default} from '@sanity/components/src/buttons/StateButton'
}

declare module 'part:@sanity/components/dialogs/fullscreen' {
  const FullscreenDialog: React.ComponentType<{
    cardClassName?: string
    className?: string
    isOpen?: boolean
    onClose?: () => void
    title?: React.ReactNode
  }>
  export default FullscreenDialog
}

declare module 'part:@sanity/components/lists/create-document' {
  const CreateDocumentList: React.ComponentType<{
    items: {}[]
  }>
  export default CreateDocumentList
}

declare module 'part:@sanity/components/tooltip' {
  export * from '@sanity/components/src/tooltip'
}

declare module 'part:@sanity/base/file-icon' {
  const DocumentIcon: React.ComponentType<{}>
  export default DocumentIcon
}

declare module 'part:@sanity/base/cog-icon' {
  const CogIcon: React.ComponentType<{}>
  export default CogIcon
}

declare module 'part:@sanity/base/help-circle-icon' {
  const HelpIcon: React.ComponentType<{}>
  export default HelpIcon
}

declare module 'part:@sanity/base/link-icon' {
  const LinkIcon: React.ComponentType<{}>
  export default LinkIcon
}

declare module 'part:@sanity/base/users-icon' {
  const UserIcon: React.ComponentType<{}>
  export default UserIcon
}

declare module 'part:@sanity/default-layout/branding-style' {
  const styles: {[key: string]: string}
  export default styles
}

declare module 'part:@sanity/base/brand-logo?' {
  const BrandLogo: React.ComponentType<{}> | undefined
  export default BrandLogo
}

declare module 'part:@sanity/base/plus-icon' {
  const PlusIcon: React.ComponentType<{}>
  export default PlusIcon
}

declare module 'part:@sanity/base/compose-icon' {
  const ComposeIcon: React.ComponentType<{}>
  export default ComposeIcon
}

declare module 'part:@sanity/base/hamburger-icon' {
  const MenuIcon: React.ComponentType<{}>
  export default MenuIcon
}

declare module 'part:@sanity/base/close-icon' {
  const CloseIcon: React.ComponentType<{}>
  export default CloseIcon
}

declare module 'part:@sanity/base/sign-out-icon' {
  const LeaveIcon: React.ComponentType<{}>
  export default LeaveIcon
}

declare module 'part:@sanity/default-layout/tool-switcher' {
  const ToolSwitcher: React.ComponentType<{
    activeToolName: string
    isVisible: boolean
    onSwitchTool: () => void
    direction: 'horizontal' | 'vertical'
    router: {state: {}}
    showLabel?: boolean
    tools: {
      canHandleIntent?: (intent: {}, params: {}, state: {}) => {}
      component?: React.ComponentType<{}>
      icon?: React.ComponentType<{}>
      getIntentState?: (intent: {}, params: {}, state: {}, payload: {}) => {}
      name: string
      title: string
      router?: {}
    }[]
    tone?: 'navbar'
  }>
  export default ToolSwitcher
}

declare module 'part:@sanity/base/search-icon' {
  const Icon: React.ComponentType<{}>
  export default Icon
}

declare module 'part:@sanity/base/chevron-down-icon' {
  const Icon: React.ComponentType<{}>
  export default Icon
}

declare module 'part:@sanity/components/avatar' {
  export type AvatarSize = any
  export const Avatar: any
  export const AvatarStack: any
}

declare module 'part:@sanity/components/menus/default' {
  const DefaultMenu: React.ComponentType<{
    items: {action: string; icon: React.ComponentType<{}>; title: string}[]
    onAction: (item: {}) => void
    onClickOutside: () => void
    origin: string
  }>
  export default DefaultMenu
}

type Schema = {icon?: React.ComponentType<{}>; name: string; title: string}

declare module 'part:@sanity/base/schema' {
  const schema: {
    _validation: {
      path: Array<string | number | {_key: string}>
      problems: {message: string; severity: string}[]
    }[]
    get: (name: string) => Schema
  }
  export default schema
}

declare module 'part:@sanity/base/schema?' {
  const schema: {_validation: {}[]; get: (name: string) => Schema} | undefined
  export default schema
}

declare module 'part:@sanity/base/preview?' {
  const preview: React.ComponentType<{
    layout: 'default'
    status: React.ReactNode
    type: Schema
    value: {}
  }>
  export default preview
}

declare module 'part:@sanity/base/util/draft-utils' {
  export const getPublishedId: (str: string) => string
}

declare module 'part:@sanity/components/loading/spinner-style'
declare module 'part:@sanity/components/loading/spinner' {
  export {default} from '@sanity/components/src/loading/Spinner'
}

declare module 'part:@sanity/base/search' {
  const search: (queryStr: string) => Observable<{}>
  export default search
}

declare module 'part:@sanity/components/typography/hotkeys' {
  const Hotkeys: React.ComponentType<{keys: string[]}>
  export default Hotkeys
}

declare module 'part:@sanity/components/dialogs/default' {
  const DefaultDialog: React.ComponentType<{
    isOpen: boolean
    onClickOutside: () => void
    onClose: () => void
    title?: React.ReactNode
  }>
  export default DefaultDialog
}

declare module 'part:@sanity/components/dialogs/content' {
  const DialogContent: React.ComponentType<{size: 'medium'; padding: 'large'}>
  export default DialogContent
}

declare module 'part:@sanity/base/package-icon' {
  const PackageIcon: React.ComponentType<{}>
  export default PackageIcon
}

declare module 'sanity:versions' {
  const versions: {[key: string]: string}
  export default versions
}

declare module 'part:@sanity/base/version-checker' {
  const VersionChecker: {
    checkVersions: () => Promise<{
      result: {
        outdated: {
          name: string
          latest: string
          severity: 'notice' | 'low' | 'medium' | 'high'
          version: string
        }[]
        isSupported: boolean
        isUpToDate: boolean
      }
    }>
  }
  export default VersionChecker
}

declare module 'part:@sanity/base/plugin-icon' {
  const PluginIcon: React.ComponentType<{}>
  export default PluginIcon
}

declare module 'config:@sanity/default-layout' {
  const defaultLayoutConfig: {
    toolSwitcher?: {
      hidden?: string[]
      order?: string[]
    }
  }
  export default defaultLayoutConfig
}

declare module 'part:@sanity/components/dialogs/fullscreen-message' {
  const FullscreenMessageDialog: React.ComponentType<{
    color?: 'danger'
    title: React.ReactNode
  }>
  export default FullscreenMessageDialog
}

declare module 'part:@sanity/components/popover' {
  export * from '@sanity/components/src/popover'
}

declare module 'part:@sanity/components/tooltip' {
  export * from '@sanity/components/src/tooltip'
}

declare module 'part:@sanity/base/util/document-action-utils' {
  export const isActionEnabled: (schema: Schema, actionName: string) => boolean
}

declare module 'part:@sanity/base/new-document-structure?' {
  const newDocumentStructure: {} | undefined
  export default newDocumentStructure
}

declare module 'part:@sanity/base/client' {
  const client: any
  export default client
}

declare module 'part:@sanity/base/error-icon' {
  const ErrorIcon: React.ComponentType<{}>
  export default ErrorIcon
}

declare module 'part:@sanity/base/spinner-icon' {
  const SpinnerIcon: React.ComponentType<{}>
  export default SpinnerIcon
}

declare module 'part:@sanity/base/warning-icon' {
  const WarningIcon: React.ComponentType<{}>
  export default WarningIcon
}

declare module 'part:@sanity/base/authentication-fetcher' {
  const fetcher: any
  export default fetcher
}
