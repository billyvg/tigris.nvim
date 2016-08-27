/**
 * Javascript syntax parsing with babylon
 *
 * @author Billy Vong <github at mmo.me>
 * @license MIT
 */
'use strict' // eslint-disable-line
;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, "next"); var callThrow = step.bind(null, "throw"); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var parser = require('vim-syntax-parser').default;
var _ = require('lodash');
var regeneratorRuntime = require('regenerator-runtime/runtime'); // eslint-disable-line

// vim vars
var ENABLE_VAR = 'tigris#enabled';
// const AUTO_START_VAR = 'tigris#auto_enable';
var DEBUG_VAR = 'tigris#debug';
var DELAY_VAR = 'tigris#delay'; // eslint-disable-line
var FLY_VAR = 'tigris#on_the_fly_enabled';
var EXT_VAR = 'tigris#extensions'; // eslint-disable-line

// defaults
var DELAY_DEFAULT = 500;
var EXT_DEFAULT = ['*.js', '*.jsx']; // eslint-disable-line
var ERR_ID = 12345;

var DEBUG_MAP = new Map();
var HL_MAP = new Map();

// Check for updates
var updateNotifier = require('update-notifier');
var pkg = require('../package.json');
var promisify = require('promisify-node');

function checkForUpdates(nvim) {
  var notifier = updateNotifier({
    pkg: pkg,
    updateCheckInterval: 1000 * 60 * 60 * 6
  });

  if (notifier && notifier.update) {
    if (nvim) {
      var updateMsg = '[tigris] Update available ' + notifier.update.current + ' →\n        ' + notifier.update.latest;

      debug(updateMsg);
      nvim.command('echomsg \'' + updateMsg + '\'');
      nvim.command('\n        echo \'[tigris]\' |\n        echon \' Update available \' |\n        echohl Comment |\n        echon \'' + notifier.update.current + '\' |\n        echohl None |\n        echon \' → \' |\n        echohl Keyword |\n        echon \'' + notifier.update.latest + '\' |\n        echohl None\n      ');
    }

    return notifier.update;
  }

  return null;
}

var highlight = function highlight(buffer, id, name, lineStart, columnStart, columnEnd, isDebug) {
  // Save highlighting group for debugging
  if (isDebug) {
    _.range(columnEnd - columnStart + 1).forEach(function (num) {
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
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    var _this = this;

    var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var nvim = _ref2.nvim;
    var filename = _ref2.filename;
    var clear = _ref2.clear;

    var api, prStart, _file, start, enabled;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            api = nvim;
            prStart = +new Date();

            Object.keys(nvim).forEach(function (key) {
              if (typeof nvim[key] === 'function') {
                api[key] = promisify(nvim[key]);
              }
            });
            debug('Promisifiy overhead ' + (new Date() - prStart));

            if (!filename) {
              debug('ERROR NO FILENAME');
            }

            _file = filename.split('/').pop();

            debug('[' + _file + '] Parse called');
            start = +new Date();
            _context2.prev = 8;
            _context2.next = 11;
            return api.getVar(ENABLE_VAR);

          case 11:
            enabled = _context2.sent;

            if (!enabled) {
              _context2.next = 14;
              break;
            }

            return _context2.delegateYield(regeneratorRuntime.mark(function _callee() {
              var isDebug, buffer, lines, newId, results, highlightPromises;
              return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _context.next = 2;
                      return api.getVar(DEBUG_VAR);

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
                      return parser(lines.join('\n'), {
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
                        buffer.clearHighlight(ERR_ID, 0, -1);
                        buffer.addHighlight(ERR_ID, 'Error', _context.t0.loc.line - 1, 0, -1);
                      }

                    case 26:

                      if (results && results.length) {
                        // Clear error highlight
                        buffer.clearHighlight(ERR_ID, 0, -1);

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
                            _.range(1, newId - 2).forEach(function (num) {
                              buffer.clearHighlight(num, 0, -1);
                            });
                          }

                          if (filename) {
                            var oldId = HL_MAP.get(filename);
                            if (oldId) {
                              debug('[' + _file + '::' + oldId + '] Clearing old highlight');
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
            })(), 't0', 14);

          case 14:
            _context2.next = 19;
            break;

          case 16:
            _context2.prev = 16;
            _context2.t1 = _context2['catch'](8);

            debug('Error', _context2.t1);

          case 19:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[8, 16]]);
  }));

  return function parse(_x) {
    return _ref.apply(this, arguments);
  };
})();

function handleBufEnter(nvim, filename) {
  checkForUpdates(nvim);

  debug('[' + filename.split('/').pop() + '] Handle buffer enter');

  parse({ nvim: nvim, filename: filename, clear: true });
}

function handleParse(nvim, filename) {
  parse({ nvim: nvim, filename: filename });
}

var flyParse = _.debounce(function (nvim, filename) {
  debug('[' + filename.split('/').pop() + '] Fly parse called');
  nvim.getVar(FLY_VAR, function (err, enableFly) {
    if (enableFly) {
      parse({ nvim: nvim, filename: filename });
    }
  });
}, DELAY_DEFAULT);

var clear = function clear(nvim) {
  nvim.getCurrentBuffer(function (err, buffer) {
    buffer.clearHighlight(-1, 0, -1);
  });

  DEBUG_MAP.clear();
};

var enable = function enable(nvim) {
  nvim.setVar(ENABLE_VAR, true, function (err) {
    if (!err) {
      parse({ nvim: nvim });
    }
  });
};

var disable = function disable(nvim) {
  nvim.setVar(ENABLE_VAR, false);

  clear(nvim);
};

plugin.function('_tigris_enable', function (nvim) {
  enable(nvim);
});

plugin.function('_tigris_disable', function (nvim) {
  disable(nvim);
});

plugin.function('_tigris_toggle', function (nvim) {
  nvim.getVar(ENABLE_VAR, function (err, enabled) {
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
  nvim.getVar(DEBUG_VAR, function (err, isDebug) {
    if (isDebug) {
      nvim.getCurrentWindow(function (err, win) {
        win.getCursor(function (err, pos) {
          try {
            var key = pos[0] + ',' + pos[1];
            if (DEBUG_MAP.has(key)) {
              var group = DEBUG_MAP.get(key);
              nvim.command('echomsg "[tigris] position: ' + key + ' - Highlight groups: ' + [group.join(', ')] + '"');
            }
          } catch (err) {
            debug(err, err.stack);
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