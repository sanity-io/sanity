import * as React from 'react'
import styles from './Modal.css'
export function Modal(props) {
  const ref = React.useRef<HTMLDialogElement>()
  React.useEffect(() => {
    if (ref.current) {
      ref.current.showModal()
    }
  }, [])
  return (
    <dialog onClose={props.onClose} className={styles.root} ref={ref}>
      <div className={styles.content}>{props.children}</div>
    </dialog>
  )
}
