import * as styles from './CollapseMenuDivider.css'

interface CollapseMenuDividerProps {
  hidden?: boolean
}

export function CollapseMenuDivider(props: CollapseMenuDividerProps) {
  const {hidden, ...rest} = props

  return (
    <div
      className={styles.dividerStyle}
      data-ui="CollapseMenuDivider"
      data-hidden={hidden ? '' : undefined}
      {...rest}
    />
  )
}
