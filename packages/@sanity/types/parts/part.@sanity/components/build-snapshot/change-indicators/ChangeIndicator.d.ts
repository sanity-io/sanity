import type React from 'react'
import {Path} from '_self_'
export declare function ChangeIndicatorScope(props: {
  path: Path
  children?: React.ReactNode
}): JSX.Element
export declare function ChangeIndicatorProvider(props: {
  path: Path
  focusPath: Path
  value: any
  compareValue: any
  children: React.ReactNode
}): JSX.Element
interface CoreProps {
  className?: string
  hidden?: boolean
  fullPath: Path
  compareDeep: boolean
  value: unknown
  hasFocus: boolean
  compareValue: unknown
  children?: React.ReactNode
}
export declare const CoreChangeIndicator: ({
  className,
  hidden,
  fullPath,
  value,
  compareValue,
  hasFocus,
  compareDeep,
  children,
}: CoreProps) => JSX.Element
export declare const ChangeIndicatorWithProvidedFullPath: ({
  className,
  hidden,
  path,
  value,
  hasFocus,
  compareDeep,
  children,
}: any) => JSX.Element
export interface ChangeIndicatorContextProvidedProps {
  className?: string
  compareDeep?: boolean
  children?: React.ReactNode
  disabled?: boolean
}
export declare const ChangeIndicatorCompareValueProvider: (props: {
  value: any
  compareValue: any
  children: React.ReactNode
}) => JSX.Element
export declare const ContextProvidedChangeIndicator: (
  props: ChangeIndicatorContextProvidedProps
) => JSX.Element
export declare const ChangeIndicator: (props: ChangeIndicatorContextProvidedProps) => JSX.Element
export {}
