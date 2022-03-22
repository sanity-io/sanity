import type {ReactElement, Component} from 'react'

export interface ClickOutsideProps {
  children: (ref: (el: HTMLElement | null) => void) => ReactElement
  onClickOutside?: () => void
}
export declare function ClickOutside({
  children,
  onClickOutside,
}: ClickOutsideProps): ReactElement<
  any,
  | string
  | ((
      props: any
    ) => ReactElement<any, string | any | (new (props: any) => Component<any, any, any>)>)
  | (new (props: any) => Component<any, any, any>)
>
