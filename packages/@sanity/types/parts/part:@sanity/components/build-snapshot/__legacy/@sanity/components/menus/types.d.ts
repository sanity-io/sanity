/// <reference types="react" />
export declare type JsonParams = Record<string, unknown>
export declare type BaseIntentParams = {
  type?: string
  id?: string
  template?: string
}
export declare type IntentParams = BaseIntentParams | [BaseIntentParams, JsonParams]
export interface Intent {
  type: string
  params?: IntentParams
}
declare type ShowAsAction = {
  whenCollapsed: boolean
}
export interface MenuItem {
  action?: string | ((params?: Record<string, string>) => void)
  danger?: boolean
  group?: string
  icon?: React.ComponentType<{
    className?: string
  }>
  intent?: Intent
  isDisabled?: boolean
  key?: string
  title: React.ReactNode
  params?: Record<string, string>
  showAsAction?: boolean | ShowAsAction
  url?: string
}
export interface MenuItemGroup {
  id: string
  title?: string
}
export {}
