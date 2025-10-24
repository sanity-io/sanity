import {thing} from './styles.css'

export function StyledTestView() {
  // throw new Error('called?')

  return (
    <div key="test" className={thing}>
      Styled with <code>vanilla extract</code>
    </div>
  )
}
