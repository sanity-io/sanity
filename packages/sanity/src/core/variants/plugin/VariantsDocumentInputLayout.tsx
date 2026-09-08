import {type ObjectInputProps} from '../../form/types/inputProps'
import {SetActiveDocument} from './structure/SetActiveDocument'

/**
 * Wraps the root object input purely to observe which document is on screen.
 * Renders the default input untouched.
 *
 * @internal
 */
export function VariantsDocumentInputLayout(props: ObjectInputProps): React.JSX.Element {
  return (
    <>
      <SetActiveDocument documentId={props.value?._id} documentType={props.value?._type} />
      {props.renderDefault(props)}
    </>
  )
}
