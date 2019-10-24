import React from 'react'
import PropTypes from 'prop-types'
import {distanceInWordsToNow} from 'date-fns'
import FormBuilder from 'part:@sanity/form-builder'
import EditorStatusBadge from '../EditorStatusBadge'
import TimeAgo from '../../components/TimeAgo'
import styles from '../styles/Editor.css'

const preventDefault = ev => ev.preventDefault()

export default class EditForm extends React.PureComponent {
  static propTypes = {
    draft: PropTypes.object,
    filterField: PropTypes.func.isRequired,
    focusPath: PropTypes.array.isRequired,
    isLiveEditEnabled: PropTypes.bool,
    markers: PropTypes.arrayOf(
      PropTypes.shape({
        path: PropTypes.array
      })
    ).isRequired,
    onBlur: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onShowHistory: PropTypes.func.isRequired,
    patchChannel: PropTypes.object.isRequired,
    published: PropTypes.object,
    initialValue: PropTypes.object,
    readOnly: PropTypes.bool.isRequired,
    schema: PropTypes.object.isRequired,
    type: PropTypes.object.isRequired
  }
  render() {
    const {
      draft,
      published,
      filterField,
      focusPath,
      initialValue,
      isLiveEditEnabled,
      markers,
      onBlur,
      onChange,
      onFocus,
      onShowHistory,
      patchChannel,
      readOnly,
      schema,
      type
    } = this.props
    const value = draft || published || initialValue
    return (
      <>
        <div className={styles.top}>
          <span className={styles.statusBadges}>
            <EditorStatusBadge
              liveEdit={isLiveEditEnabled}
              isDraft={!!draft}
              isPublished={!!published}
              title={
                published &&
                `Published ${distanceInWordsToNow(published._updatedAt, {
                  addSuffix: true
                })}`
              }
            />
          </span>
          {value && value._updatedAt && (
            <span className={styles.editedTimeClickable} onClick={onShowHistory}>
              {'Updated '}
              <TimeAgo time={value._updatedAt} />
            </span>
          )}
        </div>
        <form
          className={styles.editor}
          onSubmit={preventDefault}
          id="Sanity_Default_DeskTool_Editor_ScrollContainer"
        >
          <FormBuilder
            schema={schema}
            patchChannel={patchChannel}
            value={value || {_type: type}}
            type={type}
            filterField={filterField}
            readOnly={readOnly}
            onBlur={onBlur}
            onFocus={onFocus}
            focusPath={focusPath}
            onChange={onChange}
            markers={markers}
          />
        </form>
      </>
    )
  }
}
