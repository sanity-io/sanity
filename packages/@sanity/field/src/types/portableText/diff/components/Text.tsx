import classNames from 'classnames'
import {isKeySegment, Path, ObjectSchemaType} from '@sanity/types'
import React, {SyntheticEvent, useCallback} from 'react'
import {ConnectorContext} from '@sanity/base/lib/change-indicators'
import {startCase} from 'lodash'
// import {useClickOutside} from '@sanity/components'
// import {Popover} from 'part:@sanity/components/popover'
import {
  // ChangeList,
  DiffCard,
  DiffContext,
  DiffTooltip,
  ObjectDiff,
  StringDiff,
  StringDiffSegment
} from '../../../../diff'
import {PortableTextChild} from '../types'
import styles from './Text.css'

interface TextProps {
  diff?: StringDiff
  child: PortableTextChild
  childDiff?: ObjectDiff
  children: JSX.Element
  path: Path
  schemaType: ObjectSchemaType
  segment: StringDiffSegment
}

export function Text({
  diff,
  child,
  childDiff,
  children,
  path,
  segment,
  ...restProps
}: TextProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  const diffWithFallback = diff || childDiff
  const hasChanged =
    diffWithFallback && diffWithFallback.action !== 'unchanged' && segment.action !== 'unchanged'
  if (hasChanged) {
    return (
      <TextWithDiff
        {...restProps}
        child={child}
        childDiff={childDiff}
        diff={diff}
        segment={segment}
        path={path}
      >
        {children}
      </TextWithDiff>
    )
  }
  return <span className={styles.root}>{children}</span>
}

export function TextWithDiff({
  diff,
  child,
  childDiff,
  children,
  path,
  segment,
  schemaType,
  ...restProps
}: TextProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  const {onSetFocus} = React.useContext(ConnectorContext)
  const {path: fullPath} = React.useContext(DiffContext)
  // const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  // const [open, setOpen] = useState(false)
  const spanSegment = path.slice(-2, 1)[0]
  const className = classNames(styles.root, styles.changed)
  const isRemoved = diff && diff.action === 'removed'
  const prefix = fullPath.slice(
    0,
    fullPath.findIndex(
      seg => isKeySegment(seg) && isKeySegment(spanSegment) && seg._key === spanSegment._key
    )
  )
  const focusPath = prefix.concat(path)

  const diffCard =
    diff && diff.action !== 'unchanged' && segment.action !== 'unchanged' ? (
      <DiffCard
        annotation={diff.annotation}
        as={segment.action === 'removed' ? 'del' : 'ins'}
        tooltip={{description: `${startCase(segment.action)} text`}}
      >
        {children}
      </DiffCard>
    ) : null

  const handleOpenPopup = useCallback(
    (event: SyntheticEvent) => {
      event.stopPropagation()
      // setOpen(true)
      if (!isRemoved) {
        event.preventDefault()
        onSetFocus(focusPath)
      }
    },
    [focusPath]
  )
  // const handleClickOutside = useCallback(() => {
  //   // setOpen(false)
  // }, [])
  // useClickOutside(handleClickOutside, [popoverElement])

  const diffWithFallback = diff || childDiff

  const annotation =
    (diffWithFallback && diffWithFallback.action !== 'unchanged' && diffWithFallback.annotation) ||
    null
  const annotations = annotation ? [annotation] : []
  // const popoverContent =
  //   childDiff && childDiff.action === 'changed' ? (
  //     <DiffContext.Provider value={{path}}>
  //       <div className={styles.popoverContainer}>
  //         <div className={styles.popoverContent}>
  //           {<ChangeList diff={childDiff} schemaType={schemaType} />}
  //         </div>
  //       </div>
  //     </DiffContext.Provider>
  //   ) : null
  return (
    <span {...restProps} className={className} onClick={handleOpenPopup}>
      {/* <Popover content={popoverContent} open={open} ref={setPopoverElement}> */}
      <span className={styles.previewContainer}>
        <DiffTooltip annotations={annotations} description={`${segment.action} text`}>
          <>{diffCard}</>
        </DiffTooltip>
      </span>
      {/* </Popover> */}
    </span>
  )
}
