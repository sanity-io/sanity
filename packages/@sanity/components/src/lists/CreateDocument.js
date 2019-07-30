import React from 'react'
import PropTypes from 'prop-types'
import styles from './styles/CreateDocument.css'
import CreateDocumentPreview from 'part:@sanity/components/previews/create-document'

function CreateDocumentList(props) {
  const {templateChoices = []} = props
  return (
    <ul className={styles.root}>
      {templateChoices.map(choice => (
        <li key={choice.id} className={styles.item}>
          <CreateDocumentPreview
            title={choice.title}
            params={{template: choice.id}}
            subtitle={choice.subtitle}
            icon={choice.icon}
          />
        </li>
      ))}
    </ul>
  )
}

CreateDocumentList.propTypes = {
  templateChoices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string,
      subtitle: PropTypes.string,
      icon: PropTypes.func
    })
  )
}

export default CreateDocumentList
