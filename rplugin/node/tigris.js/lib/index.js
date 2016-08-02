/**
 * Javascript syntax parsing with babylon
 *
 * @author Billy Vong <github at mmo.me>
 * @license MIT
 */
'use strict'; // eslint-disable-line

var parser = require('vim-syntax-parser').default;
var _ = require('lodash');

// vim vars
var ENABLE_VAR = 'tigris#enabled';
// const AUTO_START_VAR = 'tigris#auto_enable';
var DEBUG_VAR = 'tigris#debug';
var DELAY_VAR = 'tigris#delay';
var FLY_VAR = 'tigris#on_the_fly_enabled';
var EXT_VAR = 'tigris#extensions';

// defaults
var DELAY_DEFAULT = 100;
var EXT_DEFAULT = ['*.js', '*.jsx'];
var ERR_ID = 12345;

var HIGHLIGHT_MAP = new Map();

function highlight(buffer, id, name, lineStart, columnStart, columnEnd, isDebug) {
  buffer.addHighlight(id, name, lineStart, columnStart, columnEnd);

  // Save highlighting group for debugging
  if (isDebug) {
    _.range(columnEnd - columnStart + 1).forEach(function (num) {
      var key = lineStart + 1 + ',' + (columnStart + num); // [lineStart, columnStart + num];
      if (!HIGHLIGHT_MAP.has(key)) {
        HIGHLIGHT_MAP.set(key, []);
      }
      var groups = HIGHLIGHT_MAP.get(key);
      groups.push(name);
      HIGHLIGHT_MAP.set(key, groups);
    });
  }
}

function parse(nvim) {
  debug('Parse start');
  var start = +new Date();
  nvim.getVar(ENABLE_VAR, function (err, enabled) {
    debug('Parsing: ', enabled);
    if (enabled) {
      nvim.getCurrentBuffer(function (err, buffer) {
        if (!err) {
          buffer.lineCount(function (err, lineCount) {
            if (!err) {
              buffer.getLines(0, lineCount, true, function (err, res) {
                if (!err) {
                  // Reset debugging map of highlight groups
                  HIGHLIGHT_MAP.clear();

                  // Call parser
                  debug('Calling tigris parser');
                  parser(res.join('\n'), {
                    plugins: ['jsx', 'flow', 'decorators', 'objectRestSpread', 'classProperties']
                  }, function (err, result) {
                    if (!err) {
                      try {
                        (function () {
                          // wtb es6
                          var type = result.type;
                          var lineStart = result.lineStart;
                          var columnStart = result.columnStart;
                          var columnEnd = result.columnEnd;

                          // Clear error highlight
                          buffer.clearHighlight(ERR_ID, 0, -1);

                          nvim.getVar(DEBUG_VAR, function (err, isDebug) {
                            highlight(buffer, -1, 'js' + type, lineStart - 1, columnStart, columnEnd, isDebug);
                          });

                          if (lineCount === lineStart) {
                            var end = +new Date();
                            debug(end - start + 'ms');
                          }
                        })();
                      } catch (err) {
                        debug('Error highlighting', err, err.stack);
                      }
                    } else {
                      // Error parsing
                      debug('Error parsing AST: ', err, err.stack);

                      // should highlight errors?
                      if (err && err.loc) {
                        // Clear previous error highlight
                        buffer.clearHighlight(ERR_ID, 0, -1);
                        buffer.addHighlight(ERR_ID, 'Error', err.loc.line - 1, 0, -1);
                      }
                    }
                  });
                } else {
                  debug('Error getting lines in current buffer: ', err, err.stack);
                }
              });
            } else {
              debug('Error getting line count in current buffer: ', err, err.stack);
            }
          });
        } else {
          debug('Error getting current buffer: ', err, err.stack);
        }
      });
    }
  });
}

var flyParse = _.debounce(function (nvim) {
  debug('Fly parse called');
  nvim.getVar(FLY_VAR, function (err, enableFly) {
    debug('Fly parse enabled?: ', enableFly);
    if (enableFly) {
      parse(nvim);
    }
  });
}, DELAY_DEFAULT);

var initialized = false;
function initialize(nvim) {
  debug('initializing');

  // Initialize debounced function
  if (!flyParse) {
    debug('Creating debounced parse function');
    nvim.getVar(DELAY_VAR, function (err, delay) {
      var delayOrDefault = delay || DELAY_DEFAULT;

      if (!initialized) {
        nvim.getVar(EXT_VAR, function (err, ext) {
          var extOrDefault = ext || EXT_DEFAULT;
          var pattern = extOrDefault.join(',');

          debug('Enabling tigris for extensions: ', pattern);

          // This doesn't seem to work
          /*
          plugin.autocmd('TextChangedI', {
            pattern,
          }, flyParse);
           plugin.autocmd('TextChanged', {
            pattern,
          }, flyParse);
           plugin.autocmd('BufEnter', {
            pattern,
          }, parse);
           plugin.autocmd('InsertLeave', {
            pattern,
          }, parse);
          */

          initialized = true;
          debug('Finished initializing');
        });
      }
    });
  }
}

plugin.function('tigris#toggle', function (nvim) {
  nvim.getVar(ENABLE_VAR, function (err, enabled) {
    nvim.setVar(ENABLE_VAR, !enabled);
  });
});

plugin.function('tigris#highlight#clear', function (nvim) {
  nvim.getCurrentBuffer(function (err, buffer) {
    buffer.clearHighlight(-1, 0, -1);
  });
});

plugin.function('tigris#parse_debounced', function (nvim, args) {
  try {
    if (typeof flyParse === 'function') {
      flyParse(nvim, args);
    }
  } catch (err) {
    debug(err, err.stack);
  }
});
plugin.function('tigris#parse', function (nvim, args) {
  // nvim.setVar("chromatica#_channel_id", nvim._channel_id);
  try {
    parse(nvim, args);
  } catch (err) {
    debug(err, err.stack);
  }
});

plugin.function('tigris#highlight#debug', function (nvim) {
  nvim.getCurrentWindow(function (err, win) {
    win.getCursor(function (err, pos) {
      try {
        var key = pos[0] + ',' + pos[1];
        if (HIGHLIGHT_MAP.has(key)) {
          var group = HIGHLIGHT_MAP.get(key);
          nvim.command('echomsg "Position: ' + key + ' - Highlight groups: ' + [group.join(', ')] + '"');
        }
      } catch (err) {
        debug(err, err.stack);
      }
    });
  });
});

plugin.autocmd('VimEnter', {
  pattern: '*'
}, initialize);

plugin.autocmd('TextChangedI', {
  pattern: '*.js,*.jsx'
}, flyParse);

plugin.autocmd('TextChanged', {
  pattern: '*.js,*.jsx'
}, flyParse);

plugin.autocmd('BufEnter', {
  pattern: '*.js,*.jsx'
}, parse);

plugin.autocmd('BufRead', {
  pattern: '*.js,*.jsx'
}, parse);

plugin.autocmd('FileReadPost', {
  pattern: '*.js,*.jsx'
}, parse);

plugin.autocmd('InsertLeave', {
  pattern: '*.js,*.jsx'
}, parse);