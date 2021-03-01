/// <reference types="react" />
export interface ClickOutsideProps {
  children: (ref: (el: HTMLElement | null) => void) => React.ReactElement
  onClickOutside?: () => void
}
export declare function ClickOutside({
  children,
  onClickOutside,
}: ClickOutsideProps): import('react').ReactElement<
  any,
  | string
  | ((
      props: any
    ) => import('react').ReactElement<
      any,
      string | any | (new (props: any) => import('react').Component<any, any, any>)
    >)
  | (new (props: any) => import('react').Component<any, any, any>)
>
