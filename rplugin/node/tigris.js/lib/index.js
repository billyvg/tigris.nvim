'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _class, _desc, _value, _class2;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _vimSyntaxParser = require('vim-syntax-parser');

var _vimSyntaxParser2 = _interopRequireDefault(_vimSyntaxParser);

var _neovim = require('neovim');

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * Javascript syntax parsing with babylon
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * @author Billy Vong <github at mmo.me>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * @license MIT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            */


// Check for updates
// import checkForUpdates from './checkForUpdate';

const DEBUG_MAP = new Map();
const HL_MAP = new Map();

const debouncedParser = _lodash2.default.debounce.call(_lodash2.default, (() => {
  var _ref = _asyncToGenerator(function* (nvim, filename, parseFunc) {
    const enableFly = yield nvim.getVar(_constants.FLY_VAR);

    console.log(`[${filename.split('/').pop()}] Fly parse enabled: ${enableFly}`);

    if (enableFly) {
      parseFunc({ filename, clear: true });
    }
  });

  return function (_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})(), _constants.DELAY_DEFAULT);

let TigrisPlugin = (_dec = (0, _neovim.Plugin)({
  name: 'tigris'
}), _dec2 = (0, _neovim.Function)('tigris_enable'), _dec3 = (0, _neovim.Function)('tigris_disable'), _dec4 = (0, _neovim.Function)('tigris_toggle'), _dec5 = (0, _neovim.Command)('TigrisClear'), _dec6 = (0, _neovim.Function)('tigris_parse_debounced'), _dec7 = (0, _neovim.Function)('tigris_parse'), _dec8 = (0, _neovim.Command)('TigrisDebug'), _dec9 = (0, _neovim.Autocmd)('TextChangedI', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")'
}), _dec10 = (0, _neovim.Autocmd)('TextChanged', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")'
}), _dec11 = (0, _neovim.Autocmd)('BufEnter', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")'
}), _dec12 = (0, _neovim.Autocmd)('InsertLeave', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")'
}), _dec(_class = (_class2 = class TigrisPlugin {
  flyParse(filename) {
    debouncedParser(this.nvim, filename, this.parse.bind(this));
  }

  enable() {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield _this.nvim.setVar(_constants.ENABLE_VAR, true);
      _this.parse();
    })();
  }

  disable() {
    this.nvim.setVar(_constants.ENABLE_VAR, false);
    this.clear();
  }

  toggle() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const enabled = yield _this2.nvim.getVar(_constants.ENABLE_VAR);
      if (enabled) {
        _this2.disable();
      } else {
        _this2.enable();
      }
    })();
  }

  clear() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const buffer = yield _this3.nvim.buffer;
      _this3.nvim.outWrite('Clearing\n');
      buffer.clearHighlight({ srcId: -1 });
      DEBUG_MAP.clear();
    })();
  }

  parseDebounced(args) {
    this.flyParse(args);
  }

  parseFunc(args) {
    this.nvim.outWrite('vim func parse');
    try {
      this.parse({ args });
    } catch (err) {
      console.log(err, err.stack);
    }
  }

  highlightDebug() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      const isDebug = yield _this4.nvim.getVar(_constants.DEBUG_VAR);
      if (isDebug) {
        const win = yield _this4.nvim.window;
        const pos = yield win.cursor;
        const key = `${pos[0]},${pos[1]}`;
        if (DEBUG_MAP.has(key)) {
          const group = DEBUG_MAP.get(key);
          _this4.nvim.command(`echomsg "[tigris] position: ${key} - Highlight groups: ${[group.join(', ')]}"`);
        } else {
          _this4.nvim.command('echomsg "[tigris] Error, position doesn\'t exist"');
          console.log('Error with highlight debug, position doesnt exist');
        }
      } else {
        _this4.nvim.command('echomsg "[tigris] console.log mode not enabled: `let g:tigris#console.log=1` to enable"');
      }
    })();
  }

  onTextChangedI(args) {
    this.flyParse(args);
  }

  onTextChanged(args) {
    this.flyParse(args);
  }

  onBufEnter() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      const filename = yield _this5.nvim.buffer.name;
      console.log(`[${filename.split('/').pop()}] Handle buffer enter`);
      _this5.parse({ filename, clear: true });
    })();
  }

  onInsertLeave(filename) {
    this.parse({ filename, clear: true });
  }

  highlight(buffer, id, name, lineStart, columnStart, columnEnd, isDebug) {
    // Save highlighting group for console.logging
    if (isDebug) {
      _lodash2.default.range(columnEnd - columnStart + 1).forEach(num => {
        const key = `${lineStart + 1},${columnStart + num}`; // [lineStart, columnStart + num];
        if (!DEBUG_MAP.has(key)) {
          DEBUG_MAP.set(key, []);
        }
        const groups = DEBUG_MAP.get(key);
        groups.push(name);
        DEBUG_MAP.set(key, groups);
      });
    }
    return ['nvim_buf_add_highlight', [buffer, id, name, lineStart, columnStart, columnEnd]];
  }

  parse({ filename, clear } = {}) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      try {
        const start = +new Date();
        const _file = filename && filename.split('/').pop() || '';
        console.log(`[${_file}] Parse called`);

        const enabled = yield _this6.nvim.getVar(_constants.ENABLE_VAR);

        if (enabled) {
          const isDebug = yield _this6.nvim.getVar(_constants.DEBUG_VAR);
          const buffer = yield _this6.nvim.buffer;
          const lines = yield buffer.lines;
          const newId = yield buffer.addHighlight({ srcId: 0, hlGroup: '', line: 0, colStart: 0, colEnd: 1 });
          DEBUG_MAP.clear();
          let results;

          // Call parser
          console.log(`[${_file}/${newId}] Calling tigris parser`);
          try {
            const parseStart = +new Date();
            results = yield (0, _vimSyntaxParser2.default)(lines.join('\n'), {
              plugins: ['asyncFunctions', 'asyncGenerators', 'classConstructorCall', 'classProperties', 'decorators', 'doExpressions', 'exponentiationOperator', 'exportExtensions', 'flow', 'functionSent', 'functionBind', 'jsx', 'objectRestSpread', 'trailingFunctionCommas']
            });
            console.log(`babylon parse time: ${+new Date() - parseStart}ms`);
          } catch (err) {
            // Error parsing
            console.log('Error parsing AST: ', err);

            // should highlight errors?
            if (err && err.loc) {
              // Clear previous error highlight
              buffer.clearHighlight({ srcId: _constants.ERR_ID });
              buffer.addHighlight({ srcId: _constants.ERR_ID, hlGroup: 'Error', line: err.loc.line - 1, colStart: 0, colEnd: -1 });
            }
          }
          console.log(`Parser time: ${+new Date() - start}ms`);

          if (results && results.length) {
            // Clear error highlight
            buffer.clearHighlight({ srcId: _constants.ERR_ID });
            const [, err] = yield _this6.nvim.callAtomic(results.map(function ({ type, lineStart, columnStart, columnEnd }) {
              return _this6.highlight(buffer, newId, `js${type}`, lineStart - 1, columnStart, columnEnd, isDebug);
            }));

            buffer.clearHighlight({ srcId: newId - 1 });
            console.log(`Total time: ${+new Date() - start}ms`);

            if (clear) {
              _lodash2.default.range(1, newId - 1).forEach(function (num) {
                buffer.clearHighlight({ srcId: num });
              });
            }

            // if (filename) {
            // const oldId = HL_MAP.get(filename);
            // if (oldId) {
            // // console.log(`[${_file}::${oldId}] Clearing old highlight`);
            // buffer.clearHighlight({ srcId: oldId });
            // }

            // HL_MAP.set(filename, newId);
            // }
          }
        }
      } catch (err) {
        console.log('Error parsing', err);
      }
    })();
  }
}, (_applyDecoratedDescriptor(_class2.prototype, 'enable', [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, 'enable'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'disable', [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, 'disable'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'toggle', [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, 'toggle'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'clear', [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, 'clear'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'parseDebounced', [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, 'parseDebounced'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'parseFunc', [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, 'parseFunc'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'highlightDebug', [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, 'highlightDebug'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'onTextChangedI', [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, 'onTextChangedI'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'onTextChanged', [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, 'onTextChanged'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'onBufEnter', [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, 'onBufEnter'), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, 'onInsertLeave', [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, 'onInsertLeave'), _class2.prototype)), _class2)) || _class);
exports.default = TigrisPlugin;