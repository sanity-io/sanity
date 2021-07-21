import React, {useMemo, useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import DefaultPane from 'part:@sanity/components/panes/default'
import listStyles from 'part:@sanity/components/lists/default-style'
import {from as observableFrom, merge} from 'rxjs'
import {map, scan, debounceTime} from 'rxjs/operators'
import {PaneItem} from '../../components/paneItem'
import {ListView} from '../../components/listView'

const EMPTY_ARRAY = []
const EMPTY_RECORD = {}

function ListPane({
  className = '',
  items = EMPTY_ARRAY,
  menuItems = EMPTY_ARRAY,
  menuItemGroups = EMPTY_ARRAY,
  displayOptions = EMPTY_RECORD,
  title,
  styles,
  defaultLayout,
  index,
  isSelected,
  isCollapsed,
  onCollapse,
  onExpand,
  childItemId,
}) {
  // create a variable to short-circuit loading states.
  const nothingHidden = useMemo(() => items.every((item) => !item.hidden), [items])
  const [hiddenIds, setHiddenIds] = useState({})

  const loading = useMemo(() => {
    // if nothing is hidden then immediately show without a loading spinner
    if (nothingHidden) return false

    return Object.keys(hiddenIds).length < items.length
  }, [hiddenIds, nothingHidden, items.length])

  useEffect(() => {
    const normalizedHiddenObservables = items.map((item) => {
      const result = typeof item.hidden === 'function' ? item.hidden() : item.hidden

      const normalizedObservable =
        result && typeof result === 'object' && ('then' in result || 'subscribe' in result)
          ? observableFrom(result)
          : observableFrom([typeof result === 'boolean' ? result : false])

      return normalizedObservable.pipe(map((isHidden) => [item.id, isHidden]))
    })

    const subscription = merge(...normalizedHiddenObservables)
      .pipe(
        scan(
          (acc, [itemId, isHidden]) =>
            // Note: this needs to be a new memory reference on each emit or
            // react will skip the re-render
            ({...acc, [itemId]: isHidden}),
          {}
        ),
        // debounce just a little so we don't set state for every synchronous value
        debounceTime(50)
      )
      .subscribe((next) => setHiddenIds(next))

    return () => subscription.unsubscribe()
  }, [items])

  return (
    <DefaultPane
      data-testid="desk-tool-list-pane"
      index={index}
      title={title}
      styles={styles}
      className={className}
      isSelected={isSelected}
      isCollapsed={isCollapsed}
      onCollapse={onCollapse}
      onExpand={onExpand}
      menuItems={menuItems}
      menuItemGroups={menuItemGroups}
    >
      {loading ? (
        // TODO: better loading component.
        <>LOADING…</>
      ) : (
        <ListView layout={defaultLayout}>
          {items
            .filter((item) => !hiddenIds[item.id])
            .map((item) => {
              const shouldShowIconForItem = (() => {
                // Specific true/false on item should have precedence over list setting
                const itemShowIcon = item.displayOptions?.showIcon
                if (typeof itemShowIcon !== 'undefined') {
                  return itemShowIcon === false ? false : item.icon
                }

                // If no item setting is defined, defer to the pane settings
                const paneShowIcons = displayOptions.showIcons
                return paneShowIcons === false ? false : item.icon
              })()

              return item.type === 'divider' ? (
                <hr key={item.id} className={listStyles.divider} />
              ) : (
                <PaneItem
                  key={item.id}
                  id={item.id}
                  index={index}
                  value={item}
                  icon={shouldShowIconForItem}
                  layout={defaultLayout}
                  isSelected={childItemId === item.id}
                  schemaType={item.schemaType}
                />
              )
            })}
        </ListView>
      )}
    </DefaultPane>
  )
}

ListPane.propTypes = {
  index: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  childItemId: PropTypes.string.isRequired,
  className: PropTypes.string,
  styles: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  defaultLayout: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      schemaType: PropTypes.shape({name: PropTypes.string}),
    })
  ),
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
    })
  ),
  menuItemGroups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    })
  ),
  displayOptions: PropTypes.shape({
    showIcons: PropTypes.bool,
  }),
  isSelected: PropTypes.bool.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  onExpand: PropTypes.func,
  onCollapse: PropTypes.func,
}

export default ListPane
