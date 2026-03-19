import {ChevronDownIcon} from '@sanity/icons'
import {isKeySegment, type ObjectSchemaType, type Path, type PortableTextChild} from '@sanity/types'
import {Box, Flex, Text, useClickOutsideEvent} from '@sanity/ui'
import {toString} from '@sanity/util/paths'
import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {DiffContext, ReviewChangesContext} from 'sanity/_singletons'

import {Popover} from '../../../../../../ui-components'
import {useChangeIndicatorsReportedValues} from '../../../../../changeIndicators'
import {useTranslation} from '../../../../../i18n'
import {ChangeList, DiffTooltip, useDiffAnnotationColor} from '../../../../diff'
import {type ObjectDiff} from '../../../../types'
import {isEmptyObject} from '../helpers'
import {annotationWrapper} from './Annotation.css'
import {inlineBox, inlineText, popoverContainer, previewContainer} from './styledComponents.css'

interface AnnotationProps {
  diff?: ObjectDiff
  object: PortableTextChild
  schemaType?: ObjectSchemaType
  path: Path
  children: ReactNode
}

export function Annotation({
  children,
  diff,
  object,
  schemaType,
  path,
  ...restProps
}: AnnotationProps) {
  const {t} = useTranslation()
  if (!schemaType) {
    return (
      <div className={annotationWrapper} {...restProps}>
        {t('changes.portable-text.unknown-annotation-schema-type')}
      </div>
    )
  }
  if (diff && diff.action !== 'unchanged') {
    return (
      <AnnnotationWithDiff
        {...restProps}
        diff={diff}
        object={object}
        schemaType={schemaType}
        path={path}
      >
        {children}
      </AnnnotationWithDiff>
    )
  }
  return <div className={annotationWrapper}>{children}</div>
}

interface AnnnotationWithDiffProps {
  diff: ObjectDiff
  object: PortableTextChild
  schemaType: ObjectSchemaType
  path: Path
  children?: ReactNode
}

function AnnnotationWithDiff({
  diff,
  children,
  object,
  schemaType,
  path,
  ...restProps
}: AnnnotationWithDiffProps) {
  const {onSetFocus} = useContext(ReviewChangesContext)
  const {path: fullPath} = useContext(DiffContext)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const {t} = useTranslation()
  const color = useDiffAnnotationColor(diff, [])
  const style = useMemo(
    () => (color ? {background: color.background, color: color.text} : {}),
    [color],
  )
  const isRemoved = diff.action === 'removed'
  const [open, setOpen] = useState(false)
  const emptyObject = object && isEmptyObject(object)
  const markDefPath = useMemo(
    () => [path[0]].concat(['markDefs', {_key: object._key}]),
    [object._key, path],
  )
  const prefix = useMemo(
    () =>
      fullPath.slice(
        0,
        fullPath.findIndex((seg) => isKeySegment(seg) && seg._key === object._key),
      ),
    [fullPath, object._key],
  )
  const annotationPath = useMemo(() => prefix.concat(path), [path, prefix])
  const myPath = useMemo(() => prefix.concat(markDefPath), [markDefPath, prefix])
  const myValue = `field-${toString(myPath)}`
  const values = useChangeIndicatorsReportedValues()
  const isEditing = useMemo(
    () => values.filter(([p]) => p.startsWith(myValue)).length > 0,
    [myValue, values],
  )

  useEffect(() => {
    if (!open && isEditing) {
      setOpen(true)
      onSetFocus(myPath)
    }
  }, [isEditing, myPath, onSetFocus, open])

  const handleOpenPopup = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation()
      setOpen(true)
      if (!isRemoved) {
        event.preventDefault()
        onSetFocus(annotationPath) // Go to span first
        setTimeout(() => onSetFocus(myPath), 10) // Open edit object interface
      }
    },
    [annotationPath, isRemoved, myPath, onSetFocus],
  )

  useClickOutsideEvent(!isEditing && (() => setOpen(false)), () => [popoverRef.current])

  const annotation = (diff.action !== 'unchanged' && diff.annotation) || null
  const annotations = useMemo(() => (annotation ? [annotation] : []), [annotation])

  const value = useMemo(() => ({path: myPath}), [myPath])

  const popoverContent = (
    <DiffContext.Provider value={value}>
      <Box className={popoverContainer} padding={3}>
        <div>
          {emptyObject && (
            <Text muted size={1} weight="medium">
              {t('changes.portable-text.empty-object-annotation', {
                annotationType: schemaType.title || schemaType.name,
              })}
            </Text>
          )}
          {!emptyObject && <ChangeList diff={diff} schemaType={schemaType} />}
        </div>
      </Box>
    </DiffContext.Provider>
  )

  return (
    <div
      className={annotationWrapper}
      {...restProps}
      onClick={handleOpenPopup}
      style={style}
      data-changed=""
      data-removed={diff.action === 'removed' ? '' : undefined}
    >
      <Popover content={popoverContent} open={open} ref={popoverRef} portal>
        <Box className={previewContainer} paddingLeft={1}>
          <DiffTooltip
            annotations={annotations}
            description={t('changes.portable-text.annotation', {context: diff.action})}
          >
            <Box className={inlineBox} style={{display: 'inline-flex'}}>
              <span>{children}</span>
              <Flex align="center" paddingX={1}>
                <Text className={inlineText} size={0}>
                  <ChevronDownIcon />
                </Text>
              </Flex>
            </Box>
          </DiffTooltip>
        </Box>
      </Popover>
    </div>
  )
}
