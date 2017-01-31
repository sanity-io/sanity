import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import styles from './styles/BlockPreview.css'

export default class PreviewWrapper extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    value: PropTypes.any
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  render() {
    const {value, type} = this.props

    const PreviewComponent = this.context.formBuilder.resolvePreviewComponent(type)

    return (
      <div className={styles.root}>
        <PreviewComponent
          layout="default"
          value={value.serialize()}
          type={type}
          schema={this.context.formBuilder.schema}
        />
      </div>
    )
  }
}
