import React, {PropTypes} from 'react'
import styles from '../styles/EditorContainer.css'

const EditorContainer = ({children}) =>
  <div className={styles.editorContainer}>
    {children}
  </div>

export default EditorContainer
