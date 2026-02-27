import {type BlockStyleProps} from 'sanity'

export const Coloured = (props: BlockStyleProps) => {
  return <div style={{border: '1px dashed lightblue', padding: '4px'}}>{props.children}</div>
}

export const Custom = (props: BlockStyleProps) => {
  return <div style={{border: '1px solid green', padding: '8px 0'}}>{props.children}</div>
}
