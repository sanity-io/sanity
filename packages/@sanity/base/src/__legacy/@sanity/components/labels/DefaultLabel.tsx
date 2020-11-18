import styles from 'part:@sanity/components/labels/default-style'
import React, {forwardRef} from 'react'

interface DefaultLabelProps extends React.HTMLProps<HTMLDivElement> {
  level: number
}

const DefaultLabel = forwardRef((props: DefaultLabelProps, ref: React.Ref<HTMLDivElement>) => {
  const {children, className, level, ...restProps} = props
  const levelClass = `level_${level}`

  return (
    <div {...restProps} className={`${styles.root} ${className} ${styles[levelClass]}`} ref={ref}>
      {children}
    </div>
  )
})

DefaultLabel.displayName = 'DefaultLabel'

export default DefaultLabel
