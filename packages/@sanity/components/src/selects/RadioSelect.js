import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/selects/radio-style'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import RadioButton from 'part:@sanity/components/radiobutton/default'

export default class RadioSelect extends React.Component {
  static propTypes = {
    legend: PropTypes.string.isRequired,
    name: PropTypes.string,
    direction: PropTypes.oneOf(['horizontal', 'vertical']),
    onChange: PropTypes.func,
    value: PropTypes.object,
    error: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    hasFocus: PropTypes.bool,
    showClearButton: PropTypes.bool,
    level: PropTypes.number,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
      })
    ),
  }

  static defaultProps = {
    onChange() {},
    onBlur() {},
    onFocus() {}
  }

  handleRadioChange = item => {
    this.props.onChange(item)
  }

  render() {
    const {legend, items, value, level, name, direction} = this.props

    return (
      <Fieldset
        className={`
          ${direction == 'vertical' ? styles.vertical : styles.horizontal}
        `}
        legend={legend}
        level={level}
      >
        <div className={styles.radioContainer}>
          {
            items.map((item, i) => {
              return (
                <div className={styles.item} key={i}>
                  <RadioButton name={name} key={i} label={item.title} item={item} onChange={this.handleRadioChange} checked={value === items[i]} />
                </div>
              )
            })
          }
        </div>
      </Fieldset>
    )
  }
}
