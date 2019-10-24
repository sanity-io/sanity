import React from 'react'
import PropTypes from 'prop-types'
import styles from './styles/CreateDocument.css'
import CreateDocumentPreview from 'part:@sanity/components/previews/create-document'

function CreateDocumentList(props) {
  const {items = []} = props
  return (
    <ul className={styles.root}>
      {items.map(choice => (
        <li key={choice.key} className={styles.item}>
          <CreateDocumentPreview
            {...choice}
            // eslint-disable-next-line react/jsx-handler-names
            onClick={choice.onClick}
          />
        </li>
      ))}
    </ul>
  )
}

CreateDocumentList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string,
      subtitle: PropTypes.string,
      icon: PropTypes.func,
      onClick: PropTypes.func
    })
  )
}

export default CreateDocumentList
