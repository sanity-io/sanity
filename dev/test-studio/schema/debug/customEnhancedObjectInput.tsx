export const CustomEnhancedObjectInput = (props: any) => {
  return <div style={{border: '1px solid red', borderRadius: 4}}>{props.renderDefault(props)}</div>
}
