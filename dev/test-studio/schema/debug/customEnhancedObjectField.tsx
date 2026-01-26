export const CustomEnhancedObjectField = (props: any) => {
  return (
    <div style={{border: '1px solid palegreen', borderRadius: 4}}>
      {props.renderDefault({
        ...props,
        title: undefined,
      })}
    </div>
  )
}
