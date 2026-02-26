import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@portabletext/editor'
import {CalendarIcon} from '@sanity/icons'
import {randomKey} from '@sanity/util/content'
import {type JSX, useCallback, useEffect, useRef} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'

export function ReleaseLinkMenuButton({selected}: {selected: boolean}): JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const pendingInsert = useRef(false)

  const insertPlaceholder = useCallback(() => {
    const schemaType = editor.schemaTypes.inlineObjects.find(
      (inlineType) => inlineType.name === 'releaseReference',
    )

    if (schemaType === undefined) {
      console.error('Schema type "releaseReference" not found')
      return
    }

    PortableTextEditor.insertChild(editor, schemaType, {
      _type: 'releaseReference',
      _key: randomKey(12),
      releaseId: '',
    })
  }, [editor])

  const handleClick = useCallback(() => {
    if (selection) {
      PortableTextEditor.select(editor, selection)
      insertPlaceholder()
    } else {
      pendingInsert.current = true
      PortableTextEditor.focus(editor)
    }
  }, [editor, selection, insertPlaceholder])

  useEffect(() => {
    if (pendingInsert.current && selection) {
      pendingInsert.current = false
      insertPlaceholder()
    }
  }, [selection, insertPlaceholder])

  return (
    <Button
      mode="bleed"
      icon={CalendarIcon}
      text={t('toolbar.link-release.text')}
      tooltipProps={{content: t('toolbar.link-release.tooltip')}}
      selected={selected}
      onClick={handleClick}
    />
  )
}
