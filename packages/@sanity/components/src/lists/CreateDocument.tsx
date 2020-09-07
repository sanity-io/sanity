import CreateDocumentPreview from 'part:@sanity/components/previews/create-document'
import React from 'react'

import styles from './styles/CreateDocument.css'

interface CreateDocumentPreviewItem {
  key: string
  title?: string
  subtitle?: string
  icon?: React.ComponentType<unknown>
  onClick?: () => void
}

interface CreateDocumentListProps {
  items: CreateDocumentPreviewItem[]
}

function CreateDocumentList(props: CreateDocumentListProps) {
  const {items = []} = props

  return (
    <ul className={styles.root}>
      {items.map(item => (
        <li key={item.key} className={styles.item}>
          <CreateDocumentPreview {...item} />
        </li>
      ))}
    </ul>
  )
}

export default CreateDocumentList
