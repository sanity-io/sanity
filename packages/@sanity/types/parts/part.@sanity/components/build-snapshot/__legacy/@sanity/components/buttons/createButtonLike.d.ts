import type React from 'react'
import {ButtonComponent, ButtonProps} from './types'
interface ButtonComponentOpts {
  displayName: string
  defaultProps?: Record<string, unknown>
}
export interface ButtonState {
  focusSetFromOutside: boolean
}
export default function createButtonLike(
  as: ButtonComponent | 'button' | 'a',
  {displayName, defaultProps}: ButtonComponentOpts
): {
  new (props: ButtonProps | Readonly<ButtonProps>): {
    _element: HTMLButtonElement | null
    state: {
      focusSetFromOutside: boolean
    }
    focus(): void
    setRootElement: (el: HTMLButtonElement | null) => void
    handleBlur: (event: React.FocusEvent<HTMLButtonElement>) => void
    handleInnerBlur: () => void
    render(): JSX.Element
    context: any
    setState<K extends 'focusSetFromOutside'>(
      state:
        | ButtonState
        | ((
            prevState: Readonly<ButtonState>,
            props: Readonly<ButtonProps>
          ) => ButtonState | Pick<ButtonState, K>)
        | Pick<ButtonState, K>,
      callback?: () => void
    ): void
    forceUpdate(callback?: () => void): void
    readonly props: Readonly<ButtonProps> &
      Readonly<{
        children?: React.ReactNode
      }>
    refs: {
      [key: string]: React.ReactInstance
    }
    componentDidMount?(): void
    shouldComponentUpdate?(
      nextProps: Readonly<ButtonProps>,
      nextState: Readonly<ButtonState>,
      nextContext: any
    ): boolean
    componentWillUnmount?(): void
    componentDidCatch?(error: Error, errorInfo: React.ErrorInfo): void
    getSnapshotBeforeUpdate?(
      prevProps: Readonly<ButtonProps>,
      prevState: Readonly<ButtonState>
    ): any
    componentDidUpdate?(
      prevProps: Readonly<ButtonProps>,
      prevState: Readonly<ButtonState>,
      snapshot?: any
    ): void
    componentWillMount?(): void
    UNSAFE_componentWillMount?(): void
    componentWillReceiveProps?(nextProps: Readonly<ButtonProps>, nextContext: any): void
    UNSAFE_componentWillReceiveProps?(nextProps: Readonly<ButtonProps>, nextContext: any): void
    componentWillUpdate?(
      nextProps: Readonly<ButtonProps>,
      nextState: Readonly<ButtonState>,
      nextContext: any
    ): void
    UNSAFE_componentWillUpdate?(
      nextProps: Readonly<ButtonProps>,
      nextState: Readonly<ButtonState>,
      nextContext: any
    ): void
  }
  new (props: ButtonProps, context: any): {
    _element: HTMLButtonElement | null
    state: {
      focusSetFromOutside: boolean
    }
    focus(): void
    setRootElement: (el: HTMLButtonElement | null) => void
    handleBlur: (event: React.FocusEvent<HTMLButtonElement>) => void
    handleInnerBlur: () => void
    render(): JSX.Element
    context: any
    setState<K extends 'focusSetFromOutside'>(
      state:
        | ButtonState
        | ((
            prevState: Readonly<ButtonState>,
            props: Readonly<ButtonProps>
          ) => ButtonState | Pick<ButtonState, K>)
        | Pick<ButtonState, K>,
      callback?: () => void
    ): void
    forceUpdate(callback?: () => void): void
    readonly props: Readonly<ButtonProps> &
      Readonly<{
        children?: React.ReactNode
      }>
    refs: {
      [key: string]: React.ReactInstance
    }
    componentDidMount?(): void
    shouldComponentUpdate?(
      nextProps: Readonly<ButtonProps>,
      nextState: Readonly<ButtonState>,
      nextContext: any
    ): boolean
    componentWillUnmount?(): void
    componentDidCatch?(error: Error, errorInfo: React.ErrorInfo): void
    getSnapshotBeforeUpdate?(
      prevProps: Readonly<ButtonProps>,
      prevState: Readonly<ButtonState>
    ): any
    componentDidUpdate?(
      prevProps: Readonly<ButtonProps>,
      prevState: Readonly<ButtonState>,
      snapshot?: any
    ): void
    componentWillMount?(): void
    UNSAFE_componentWillMount?(): void
    componentWillReceiveProps?(nextProps: Readonly<ButtonProps>, nextContext: any): void
    UNSAFE_componentWillReceiveProps?(nextProps: Readonly<ButtonProps>, nextContext: any): void
    componentWillUpdate?(
      nextProps: Readonly<ButtonProps>,
      nextState: Readonly<ButtonState>,
      nextContext: any
    ): void
    UNSAFE_componentWillUpdate?(
      nextProps: Readonly<ButtonProps>,
      nextState: Readonly<ButtonState>,
      nextContext: any
    ): void
  }
  displayName: string
  defaultProps: Record<string, unknown>
  contextType?: React.Context<any>
}
export {}
