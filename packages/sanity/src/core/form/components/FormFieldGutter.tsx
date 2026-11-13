import {type ComponentType, type CSSProperties} from 'react'

import {type BaseFieldProps} from '../types/fieldProps'
import {pathToAnchorIdent} from '../utils/pathToAnchorIdent'
import {FormBaseVariantDiffIndicator} from './FormBaseVariantDiffIndicator'
import {FormDivergenceIndicator} from './FormDivergenceIndicator'
import {formFieldAnchor, formFieldAnchorPath, formFieldLabelAnchorPath} from './FormFieldAnchor.css'
import {formFieldGutter} from './FormFieldGutter.css'

/**
 * @internal
 */
export type FormFieldGutterProps = Pick<BaseFieldProps, 'path' | 'changedFromBaseVariant'> & {
  /**
   * Whether the field has a title row to line a base variant mark up with. Without one the mark
   * keeps following the input.
   */
  labelAnchored?: boolean
}

/**
 * The contents of the form field start gutter.
 *
 * @internal
 */
export const FormFieldGutter: ComponentType<FormFieldGutterProps> = ({
  path,
  changedFromBaseVariant,
  labelAnchored = false,
}) => {
  // `FormField` and `FormFieldSet` are exported from `sanity`, and `path` only became a required
  // prop in v5.17. Custom inputs written before that still render them without one, so the gutter
  // must tolerate a missing path instead of letting `pathToAnchorIdent` throw and take down the
  // whole form. Without a path there is nothing to anchor to and no divergence to look up.
  const hasPath = Array.isArray(path)

  return (
    <div
      data-testid="form-field-gutter"
      className={hasPath ? `${formFieldAnchor} ${formFieldGutter}` : formFieldGutter}
      style={
        hasPath
          ? ({
              [formFieldAnchorPath]: pathToAnchorIdent('input', path),
              // A base variant mark lines up with the field's title row whatever the kind of field
              // (the input of a Portable Text field or an object has no single place to follow).
              // Which of the two the gutter follows is decided in CSS by the child it shows
              // (`formFieldAnchor`), never by `changedFromBaseVariant`: the mark keeps its place
              // while it fades out, and a divergence indicator shown first stays on the input.
              [formFieldLabelAnchorPath]: pathToAnchorIdent(
                labelAnchored ? 'label' : 'input',
                path,
              ),
            } as CSSProperties)
          : undefined
      }
    >
      {hasPath && <FormDivergenceIndicator path={path} />}
      <FormBaseVariantDiffIndicator changedFromBaseVariant={changedFromBaseVariant} />
    </div>
  )
}
