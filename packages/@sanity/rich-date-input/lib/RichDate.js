'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.default = void 0

var _momentTimezone = _interopRequireDefault(require('moment-timezone'))

var _generateHelpUrl = _interopRequireDefault(require('@sanity/generate-help-url'))

var _propTypes = _interopRequireDefault(require('prop-types'))

var _react = _interopRequireDefault(require('react'))

var _default = _interopRequireDefault(require('part:@sanity/components/formfields/default'))

var _RichDate = _interopRequireDefault(require('./RichDate.css'))

var _patchEvent = require('part:@sanity/form-builder/patch-event')

var _reactDatepicker = _interopRequireDefault(require('react-datepicker'))

require('react-datepicker/dist/react-datepicker-cssmodules.css')

var _default2 = _interopRequireDefault(require('part:@sanity/components/selects/default'))

var _util = require('./util')

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj}
}

function _extends() {
  _extends =
    Object.assign ||
    function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key]
          }
        }
      }
      return target
    }
  return _extends.apply(this, arguments)
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    })
  } else {
    obj[key] = value
  }
  return obj
}

var DEPRECATION_WARNING = /*#__PURE__*/ _react.default.createElement(
  'div',
  {
    className: _RichDate.default.deprecationWarning,
  },
  'This field has ',
  /*#__PURE__*/ _react.default.createElement('code', null, 'type: ', 'date'),
  ', which is deprecated and should be changed to',
  ' ',
  /*#__PURE__*/ _react.default.createElement('code', null, 'type: ', 'richDate'),
  '. Please update your schema and migrate your data.',
  ' ',
  /*#__PURE__*/ _react.default.createElement(
    'a',
    {
      href: (0, _generateHelpUrl.default)('migrate-to-rich-date'),
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    'More info'
  )
)

class RichDateInput extends _react.default.PureComponent {
  constructor() {
    super(...arguments)

    _defineProperty(this, 'handleChange', (nextValue) => {
      var onChange = this.props.onChange
      var assembledValue = this.assembleOutgoingValue(nextValue)
      onChange(
        _patchEvent.PatchEvent.from(
          assembledValue ? (0, _patchEvent.set)(assembledValue) : (0, _patchEvent.unset)()
        )
      )
    })

    _defineProperty(this, 'handleTimeChange', (nextValue) => {
      var onChange = this.props.onChange
      var assembledValue = this.assembleOutgoingValue(nextValue.value)
      onChange(
        _patchEvent.PatchEvent.from(
          assembledValue ? (0, _patchEvent.set)(assembledValue) : (0, _patchEvent.unset)()
        )
      )
    })

    _defineProperty(this, 'getCurrentValue', () => {
      var value = this.props.value

      if (!value) {
        return null
      }

      return (0, _util.getOptions)(this.props).inputUtc ? value.utc : value.local
    })
  }

  assembleOutgoingValue(newMoment) {
    if (!newMoment || !newMoment.isValid()) {
      return undefined
    }

    var name = this.props.type.name

    if ((0, _util.getOptions)(this.props).inputUtc) {
      return {
        _type: name,
        utc: newMoment.utc().format(), // e.g. "2017-02-12T09:15:00Z"
      }
    }

    return {
      _type: name,
      local: newMoment.format(),
      // e.g. 2017-02-21T10:15:00+01:00
      utc: newMoment.utc().format(),
      // e.g. 2017-02-12T09:15:00Z
      timezone: _momentTimezone.default.tz.guess(),
      // e.g. Europe/Oslo
      offset: (0, _momentTimezone.default)().utcOffset(), // e.g. 60 (utc offset in minutes)
    }
  }

  render() {
    var _this$props = this.props,
      value = _this$props.value,
      type = _this$props.type,
      level = _this$props.level
    var title = type.title,
      description = type.description
    var options = (0, _util.getOptions)(this.props)
    var format = [
      options.inputDate ? options.dateFormat : null,
      options.inputTime ? options.timeFormat : null,
    ]
      .filter(Boolean)
      .join(' ')
    var timeIntervals = (0, _util.getTimeIntervals)(value, options)
    var activeTimeInterval = timeIntervals.find((time) => time.isActive === true)
    var placeholder = typeof type.placeholder === 'function' ? type.placeholder() : type.placeholder
    return /*#__PURE__*/ _react.default.createElement(
      _default.default,
      {
        labelFor: this.inputId,
        label: title,
        level: level,
        description: description,
      },
      type.name === 'date' && DEPRECATION_WARNING,
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: options.inputTime ? _RichDate.default.rootWithTime : _RichDate.default.root,
        },
        options.inputDate &&
          /*#__PURE__*/ _react.default.createElement(
            _reactDatepicker.default,
            _extends({}, options, {
              showMonthDropdown: true,
              showYearDropdown: true,
              todayButton: options.calendarTodayLabel,
              selected:
                value && (0, _momentTimezone.default)(options.inputUtc ? value.utc : value.local),
              placeholderText: placeholder,
              calendarClassName: _RichDate.default.datepicker,
              className: _RichDate.default.input,
              onChange: this.handleChange,
              value:
                value &&
                (0, _momentTimezone.default)(options.inputUtc ? value.utc : value.local).format(
                  format
                ),
              showTimeSelect: options.inputTime,
              dateFormat: options.dateFormat,
              timeFormat: options.timeFormat,
              timeIntervals: options.timeStep,
            })
          ),
        !options.inputDate &&
          options.inputTime &&
          /*#__PURE__*/ _react.default.createElement(_default2.default, {
            items: timeIntervals,
            value: activeTimeInterval,
            onChange: this.handleTimeChange,
          })
      )
    )
  }
}

exports.default = RichDateInput
RichDateInput.propTypes = {
  value: _propTypes.default.shape({
    utc: _propTypes.default.string,
    local: _propTypes.default.string,
    timezone: _propTypes.default.string,
    offset: _propTypes.default.number,
  }),
  type: _propTypes.default.shape({
    title: _propTypes.default.string.isRequired,
    name: _propTypes.default.string.isRequired,
    options: _propTypes.default.object,
  }),
  onChange: _propTypes.default.func,
  level: _propTypes.default.number,
}
RichDateInput.contextTypes = {
  resolveInputComponent: _propTypes.default.func,
  schema: _propTypes.default.object,
  intl: _propTypes.default.shape({
    locale: _propTypes.default.string,
  }),
}
