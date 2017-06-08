'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xor2 = require('lodash/xor');

var _xor3 = _interopRequireDefault(_xor2);

var _has2 = require('lodash/has');

var _has3 = _interopRequireDefault(_has2);

var _get2 = require('lodash/get');

var _get3 = _interopRequireDefault(_get2);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _default = require('part:@sanity/components/formfields/default');

var _default2 = _interopRequireDefault(_default);

var _default3 = require('part:@sanity/components/fieldsets/default');

var _default4 = _interopRequireDefault(_default3);

var _default5 = require('part:@sanity/components/selects/default');

var _default6 = _interopRequireDefault(_default5);

var _PatchEvent = require('@sanity/form-builder/PatchEvent');

var _PatchEvent2 = _interopRequireDefault(_PatchEvent);

var _reactAce = require('react-ace');

var _reactAce2 = _interopRequireDefault(_reactAce);

var _Fieldset = require('./Fieldset.css');

var _Fieldset2 = _interopRequireDefault(_Fieldset);

var _Styles = require('./Styles.css');

var _Styles2 = _interopRequireDefault(_Styles);

require('brace/mode/text');

require('brace/mode/javascript');

require('brace/mode/jsx');

require('brace/mode/markdown');

require('brace/mode/css');

require('brace/mode/html');

require('brace/theme/tomorrow');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function compareNumbers(a, b) {
  // eslint-disable-line id-length
  return a - b;
}

var SUPPORTED_LANGUAGES = [{ title: 'JSX', value: 'jsx' }, { title: 'JavaScript', value: 'javascript' }, { title: 'Markdown', value: 'markdown' }, { title: 'CSS', value: 'css' }, { title: 'HTML', value: 'html' }, { title: 'text', value: 'text' }];

var CodeInput = function (_React$Component) {
  _inherits(CodeInput, _React$Component);

  function CodeInput() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, CodeInput);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = CodeInput.__proto__ || Object.getPrototypeOf(CodeInput)).call.apply(_ref, [this].concat(args))), _this), _this.state = {
      hasFocus: false
    }, _this.handleCodeChange = function (code) {
      var _this$props = _this.props,
          type = _this$props.type,
          onChange = _this$props.onChange;

      var path = ['code'];

      var fixedLanguage = (0, _get3.default)(type, 'options.language');

      onChange(_PatchEvent2.default.from([(0, _PatchEvent.setIfMissing)({ _type: type.name, language: fixedLanguage }), code ? (0, _PatchEvent.set)(code, path) : (0, _PatchEvent.unset)(path)]));
    }, _this.handleToggleSelectLine = function (line) {
      var _this$props2 = _this.props,
          type = _this$props2.type,
          onChange = _this$props2.onChange;

      var path = ['highlightedLines'];

      var highlightedLines = (0, _xor3.default)(_this.props.value.highlightedLines, [line]).sort(compareNumbers);

      onChange(_PatchEvent2.default.from([(0, _PatchEvent.setIfMissing)({ _type: type.name, highlightedLines: [] }), line ? (0, _PatchEvent.set)(highlightedLines, path) : (0, _PatchEvent.unset)(path)]));
    }, _this.handleEditorLoad = function (editor) {
      editor.focus();
      editor.on('guttermousedown', function (event) {
        var target = event.domEvent.target;
        if (target.className.indexOf('ace_gutter-cell') == -1) {
          return;
        }
        var row = event.getDocumentPosition().row;
        _this.handleToggleSelectLine('' + row);
      });
    }, _this.handleLanguageChange = function (item) {
      var _this$props3 = _this.props,
          type = _this$props3.type,
          onChange = _this$props3.onChange;

      var path = ['language'];
      onChange(_PatchEvent2.default.from([(0, _PatchEvent.setIfMissing)({ _type: type.name }), item ? (0, _PatchEvent.set)(item.value, path) : (0, _PatchEvent.unset)(path)]));
    }, _this.createMarkers = function (rows) {
      var markers = rows.map(function (row) {
        return {
          startRow: Number(row),
          startCol: 0,
          endRow: Number(row),
          endCol: 500,
          className: _Styles2.default.highlight,
          type: 'background',
          inFront: true
        };
      });
      return markers;
    }, _this.renderEditor = function () {
      var _this$props4 = _this.props,
          value = _this$props4.value,
          type = _this$props4.type;

      var fixedLanguage = (0, _get3.default)(type, 'options.language');
      return _react2.default.createElement(_reactAce2.default, {
        mode: value.language || fixedLanguage || 'text',
        theme: 'tomorrow',
        width: '100%',
        onChange: _this.handleCodeChange,
        name: _this._inputId + '__aceEditor',
        value: value.code || '',
        markers: value.highlightedLines ? _this.createMarkers(value.highlightedLines) : null,
        onLoad: _this.handleEditorLoad,
        editorProps: {
          $blockScrolling: true
        }
      });
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(CodeInput, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          value = _props.value,
          type = _props.type,
          level = _props.level;


      if ((0, _has3.default)(type, 'options.language')) {
        return _react2.default.createElement(
          _default4.default,
          { styles: _Fieldset2.default, legend: type.title, description: type.description },
          this.renderEditor()
        );
      }

      var currentLanguage = value && value.language ? SUPPORTED_LANGUAGES.find(function (item) {
        return item.value === value.language;
      }) : null;

      var languageField = type.fields.find(function (field) {
        return field.name === 'language';
      });
      var languages = currentLanguage ? SUPPORTED_LANGUAGES : [{ title: 'Select language' }].concat(SUPPORTED_LANGUAGES);

      return _react2.default.createElement(
        _default4.default,
        { legend: type.title, description: type.description },
        _react2.default.createElement(_default6.default, {
          label: languageField.type.title,
          onChange: this.handleLanguageChange,
          value: currentLanguage,
          items: languages,
          level: level + 1
        }),
        _react2.default.createElement(
          _default2.default,
          { label: type.title, level: level + 1 },
          this.renderEditor()
        )
      );
    }
  }]);

  return CodeInput;
}(_react2.default.Component);

CodeInput.propTypes = {
  type: _propTypes2.default.object,
  level: _propTypes2.default.number.isRequired,
  value: _propTypes2.default.shape({
    _type: _propTypes2.default.string,
    code: _propTypes2.default.string,
    language: _propTypes2.default.string,
    highlightedLines: _propTypes2.default.array
  }),
  onChange: _propTypes2.default.func
};
CodeInput.defaultProps = {
  value: '',
  onChange: function onChange() {}
};
exports.default = CodeInput;