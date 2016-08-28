'use strict';

var _vimSyntaxParser = require('vim-syntax-parser');

var _vimSyntaxParser2 = _interopRequireDefault(_vimSyntaxParser);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _runtime = require('regenerator-runtime/runtime');

var _runtime2 = _interopRequireDefault(_runtime);

var _promisifyNode = require('promisify-node');

var _promisifyNode2 = _interopRequireDefault(_promisifyNode);

var _checkForUpdate = require('./checkForUpdate');

var _checkForUpdate2 = _interopRequireDefault(_checkForUpdate);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, "next"); var callThrow = step.bind(null, "throw"); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Javascript syntax parsing with babylon
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @author Billy Vong <github at mmo.me>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @license MIT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */
// eslint-disable-line

// Check for updates

var DEBUG_MAP = new Map();
var HL_MAP = new Map();

var highlight = function highlight(buffer, id, name, lineStart, columnStart, columnEnd, isDebug) {
  // Save highlighting group for debugging
  if (isDebug) {
    _lodash2.default.range(columnEnd - columnStart + 1).forEach(function (num) {
      var key = lineStart + 1 + ',' + (columnStart + num); // [lineStart, columnStart + num];
      if (!DEBUG_MAP.has(key)) {
        DEBUG_MAP.set(key, []);
      }
      var groups = DEBUG_MAP.get(key);
      groups.push(name);
      DEBUG_MAP.set(key, groups);
    });
  }
  return new Promise(function (resolve, reject) {
    buffer.addHighlight(id, name, lineStart, columnStart, columnEnd, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

var parse = (function () {
  var _ref = _asyncToGenerator(_runtime2.default.mark(function _callee2() {
    var _this = this;

    var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var nvim = _ref2.nvim;
    var filename = _ref2.filename;
    var clear = _ref2.clear;

    var api, _start, key, _key, _file, start, enabled;

    return _runtime2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            api = nvim;

            try {
              _start = +new Date();

              for (key in nvim) {
                // eslint-disable-line
                if (typeof nvim[key] === 'function') {
                  api[key] = (0, _promisifyNode2.default)(nvim[key]);
                }
              }
              for (_key in nvim.Buffer) {
                // eslint-disable-line
                if (typeof nvim.Buffer[_key] === 'function') {
                  api.Buffer[_key] = (0, _promisifyNode2.default)(nvim.Buffer[_key]);
                }
              }
              debug('Promisifiy overhead ' + (new Date() - _start) + 'ms');
            } catch (err) {
              debug('Error promisifying nvim api', err, err.stack);
            }

            _file = filename && filename.split('/').pop() || '';

            debug('[' + _file + '] Parse called');
            start = +new Date();
            _context2.prev = 5;
            _context2.next = 8;
            return api.getVar(_constants.ENABLE_VAR);

          case 8:
            enabled = _context2.sent;

            if (!enabled) {
              _context2.next = 11;
              break;
            }

            return _context2.delegateYield(_runtime2.default.mark(function _callee() {
              var isDebug, buffer, lines, newId, results, highlightPromises;
              return _runtime2.default.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _context.next = 2;
                      return api.getVar(_constants.DEBUG_VAR);

                    case 2:
                      isDebug = _context.sent;
                      _context.next = 5;
                      return api.getCurrentBuffer();

                    case 5:
                      buffer = _context.sent;
                      _context.next = 8;
                      return buffer.getLines(0, -1, true);

                    case 8:
                      lines = _context.sent;
                      _context.next = 11;
                      return buffer.addHighlight(0, '', 0, 0, 1);

                    case 11:
                      newId = _context.sent;

                      DEBUG_MAP.clear();
                      results = undefined;

                      // Call parser

                      debug('[' + _file + '/' + newId + '] Calling tigris parser');
                      _context.prev = 15;
                      _context.next = 18;
                      return (0, _vimSyntaxParser2.default)(lines.join('\n'), {
                        plugins: ['asyncFunctions', 'asyncGenerators', 'classConstructorCall', 'classProperties', 'decorators', 'doExpressions', 'exponentiationOperator', 'exportExtensions', 'flow', 'functionSent', 'functionBind', 'jsx', 'objectRestSpread', 'trailingFunctionCommas']
                      });

                    case 18:
                      results = _context.sent;
                      _context.next = 26;
                      break;

                    case 21:
                      _context.prev = 21;
                      _context.t0 = _context['catch'](15);

                      // Error parsing
                      debug('Error parsing AST: ', _context.t0);
                      nvim.callFunction('tigris#util#print_error', 'Error parsing AST: ' + _context.t0);

                      // should highlight errors?
                      if (_context.t0 && _context.t0.loc) {
                        // Clear previous error highlight
                        buffer.clearHighlight(_constants.ERR_ID, 0, -1);
                        buffer.addHighlight(_constants.ERR_ID, 'Error', _context.t0.loc.line - 1, 0, -1);
                      }

                    case 26:

                      if (results && results.length) {
                        // Clear error highlight
                        buffer.clearHighlight(_constants.ERR_ID, 0, -1);

                        highlightPromises = results.map(function (result) {
                          // wtb es6
                          var type = result.type;
                          var lineStart = result.lineStart;
                          var columnStart = result.columnStart;
                          var columnEnd = result.columnEnd;

                          return highlight(buffer, newId, 'js' + type, lineStart - 1, columnStart, columnEnd, isDebug);
                        });

                        Promise.all(highlightPromises).then(function () {
                          var end = +new Date();
                          debug('Parse time: ' + (end - start) + 'ms');

                          if (clear) {
                            _lodash2.default.range(1, newId - 2).forEach(function (num) {
                              buffer.clearHighlight(num, 0, -1);
                            });
                          }

                          if (filename) {
                            var oldId = HL_MAP.get(filename);
                            if (oldId) {
                              // debug(`[${_file}::${oldId}] Clearing old highlight`);
                              buffer.clearHighlight(oldId, 0, -1);
                            }

                            HL_MAP.set(filename, newId);
                          }
                        }).catch(function (err) {
                          debug('Error highlighting', err, err.stack);
                        });
                      }

                    case 27:
                    case 'end':
                      return _context.stop();
                  }
                }
              }, _callee, _this, [[15, 21]]);
            })(), 't0', 11);

          case 11:
            _context2.next = 16;
            break;

          case 13:
            _context2.prev = 13;
            _context2.t1 = _context2['catch'](5);

            debug('Error', _context2.t1);

          case 16:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[5, 13]]);
  }));

  return function parse(_x) {
    return _ref.apply(this, arguments);
  };
})();

function handleBufEnter(nvim, filename) {
  (0, _checkForUpdate2.default)(nvim);

  debug('[' + filename.split('/').pop() + '] Handle buffer enter');

  parse({ nvim: nvim, filename: filename, clear: true });
}

function handleParse(nvim, filename) {
  parse({ nvim: nvim, filename: filename });
}

var flyParse = _lodash2.default.debounce(function (nvim, filename) {
  debug('[' + filename.split('/').pop() + '] Fly parse called');
  nvim.getVar(_constants.FLY_VAR, function (err, enableFly) {
    if (enableFly) {
      parse({ nvim: nvim, filename: filename });
    }
  });
}, _constants.DELAY_DEFAULT);

var clear = function clear(nvim) {
  nvim.getCurrentBuffer(function (err, buffer) {
    buffer.clearHighlight(-1, 0, -1);
  });

  DEBUG_MAP.clear();
};

var enable = function enable(nvim) {
  nvim.setVar(_constants.ENABLE_VAR, true, function (err) {
    if (!err) {
      parse({ nvim: nvim });
    }
  });
};

var disable = function disable(nvim) {
  nvim.setVar(_constants.ENABLE_VAR, false);

  clear(nvim);
};

plugin.function('_tigris_enable', function (nvim) {
  enable(nvim);
});

plugin.function('_tigris_disable', function (nvim) {
  disable(nvim);
});

plugin.function('_tigris_toggle', function (nvim) {
  nvim.getVar(_constants.ENABLE_VAR, function (err, enabled) {
    if (enabled) {
      disable(nvim);
    } else {
      enable(nvim);
    }
  });
});

plugin.function('_tigris_highlight_clear', function (nvim) {
  clear(nvim);
});

plugin.function('_tigris_parse_debounced', function (nvim, args) {
  try {
    if (typeof flyParse === 'function') {
      flyParse(nvim, args);
    }
  } catch (err) {
    debug(err, err.stack);
  }
});
plugin.function('_tigris_parse', function (nvim, args) {
  debug('vim func parse');
  try {
    parse({ nvim: nvim, args: args });
  } catch (err) {
    debug(err, err.stack);
  }
});

plugin.function('_tigris_highlight_debug', function (nvim) {
  nvim.getVar(_constants.DEBUG_VAR, function (err, isDebug) {
    if (isDebug) {
      nvim.getCurrentWindow(function (err, win) {
        win.getCursor(function (err, pos) {
          try {
            if (pos) {
              var key = pos[0] + ',' + pos[1];
              if (DEBUG_MAP.has(key)) {
                var group = DEBUG_MAP.get(key);
                nvim.command('echomsg "[tigris] position: ' + key + ' - Highlight groups: ' + [group.join(', ')] + '"');
              }
            } else {
              nvim.command('echomsg "[tigris] Error, position doesn\'t exist"');
              debug('Error with highlight debug, position doesnt exist');
            }
          } catch (err) {
            debug('Error with highlight debug', err, err.stack);
          }
        });
      });
    } else {
      nvim.command('echomsg "[tigris] debug mode not enabled: "let g:tigris#debug=1" to enable');
    }
  });
});

/*
plugin.autocmd('VimEnter', {
  pattern: '*',
}, initialize);
*/

plugin.autocmd('TextChangedI', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")'
}, flyParse);

plugin.autocmd('TextChanged', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")'
}, flyParse);

plugin.autocmd('BufEnter', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")'
}, handleBufEnter);

/*
plugin.autocmd('BufRead', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")',
}, (nvim, filename) => {
  debug("BufRead");

  parse({ nvim, filename, clear: true });
});

plugin.autocmd('FileReadPost', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")',
}, handleParse);
*/

plugin.autocmd('InsertLeave', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")'
}, handleParse);