/**
 * Javascript syntax parsing with babylon
 *
 * @author Billy Vong <github at mmo.me>
 * @license MIT
 */
'use strict'; // eslint-disable-line
const parser = require('vim-syntax-parser').default;
const _ = require('lodash');

// vim vars
const ENABLE_VAR = 'tigris#enabled';
// const AUTO_START_VAR = 'tigris#auto_enable';
const DEBUG_VAR = 'tigris#debug';
const DELAY_VAR = 'tigris#delay';
const FLY_VAR = 'tigris#on_the_fly_enabled';
const EXT_VAR = 'tigris#extensions';

// defaults
const DELAY_DEFAULT = 500;
const EXT_DEFAULT = ['*.js', '*.jsx'];
const ERR_ID = 12345;

const HIGHLIGHT_MAP = new Map();

function highlight(buffer, id, name, lineStart, columnStart, columnEnd, isDebug) {
  buffer.addHighlight(id, name, lineStart, columnStart, columnEnd);

  // Save highlighting group for debugging
  if (isDebug) {
    _.range(columnEnd - columnStart + 1).forEach((num) => {
      const key = `${lineStart + 1},${columnStart + num}`; // [lineStart, columnStart + num];
      if (!HIGHLIGHT_MAP.has(key)) {
        HIGHLIGHT_MAP.set(key, []);
      }
      const groups = HIGHLIGHT_MAP.get(key);
      groups.push(name);
      HIGHLIGHT_MAP.set(key, groups);
    });
  }
}

function parse(nvim) {
  debug('Parse start');
  const start = +new Date();
  nvim.getVar(ENABLE_VAR, (err, enabled) => {
    debug('Should parse?: ', enabled);
    if (enabled) {
      nvim.getCurrentBuffer((err, buffer) => {
        if (!err) {
          buffer.lineCount((err, lineCount) => {
            if (!err) {
              buffer.getLines(0, lineCount, true, (err, res) => {
                if (!err) {
                  // Reset debugging map of highlight groups
                  HIGHLIGHT_MAP.clear();
                  buffer.clearHighlight(-1, 0, -1);

                  // Call parser
                  debug('Calling tigris parser');
                  parser(res.join('\n'), {
                    plugins: [
                      'jsx',
                      'flow',
                      'decorators',
                      'objectRestSpread',
                      'classProperties',
                    ],
                  }, (err, result) => {
                    if (!err) {
                      try {
                        // wtb es6
                        const type = result.type;
                        const lineStart = result.lineStart;
                        const columnStart = result.columnStart;
                        const columnEnd = result.columnEnd;

                        // Clear error highlight
                        buffer.clearHighlight(ERR_ID, 0, -1);

                        nvim.getVar(DEBUG_VAR, (err, isDebug) => {
                          highlight(
                            buffer, -1, `js${type}`, lineStart - 1, columnStart, columnEnd, isDebug
                          );
                        });

                        if (lineCount === lineStart) {
                          const end = +new Date();
                          debug(`${end - start}ms`);
                        }
                      } catch (err) {
                        debug('Error highlighting', err, err.stack);
                      }
                    } else {
                      // Error parsing
                      debug('Error parsing AST: ', err, err.stack);
                      nvim.callFunction('tigris#util#print_error', `Error parsing AST: ${err}`);

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

const flyParse = _.debounce((nvim) => {
  debug('Fly parse called');
  nvim.getVar(FLY_VAR, (err, enableFly) => {
    debug('Fly parse enabled?: ', enableFly);
    if (enableFly) {
      parse(nvim);
    }
  });
}, DELAY_DEFAULT);

let initialized = false;
function initialize(nvim) {
  debug('initializing');

  // Initialize debounced function
  if (!flyParse) {
    debug('Creating debounced parse function');
    nvim.getVar(DELAY_VAR, (err, delay) => {
      const delayOrDefault = delay || DELAY_DEFAULT;

      if (!initialized) {
        nvim.getVar(EXT_VAR, (err, ext) => {
          const extOrDefault = ext || EXT_DEFAULT;
          const pattern = extOrDefault.join(',');

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

plugin.function('_tigris_enable', (nvim) => {
  nvim.setVar(ENABLE_VAR, true, (err) => {
    if (!err) {
      parse(nvim);
    }
  });
});

plugin.function('_tigris_disable', (nvim) => {
  nvim.setVar(ENABLE_VAR, false);

  nvim.getCurrentBuffer((err, buffer) => {
    buffer.clearHighlight(-1, 0, -1);
  });

  HIGHLIGHT_MAP.clear();
});

plugin.function('_tigris_toggle', (nvim) => {
  nvim.getVar(ENABLE_VAR, (err, enabled) => {
    nvim.setVar(ENABLE_VAR, !enabled);
  });
});

plugin.function('_tigris_highlight_clear', (nvim) => {
  nvim.getCurrentBuffer((err, buffer) => {
    buffer.clearHighlight(-1, 0, -1);
  });

  HIGHLIGHT_MAP.clear();
});

plugin.function('_tigris_parse_debounced', (nvim, args) => {
  try {
    if (typeof flyParse === 'function') {
      flyParse(nvim, args);
    }
  } catch (err) {
    debug(err, err.stack);
  }
});
plugin.function('_tigris_parse', (nvim, args) => {
  debug('vim func parse');
  try {
    parse(nvim, args);
  } catch (err) {
    debug(err, err.stack);
  }
});

plugin.function('_tigris_highlight_debug', (nvim) => {
  nvim.getVar(DEBUG_VAR, (err, isDebug) => {
    if (isDebug) {
      nvim.getCurrentWindow((err, win) => {
        win.getCursor((err, pos) => {
          try {
            const key = `${pos[0]},${pos[1]}`;
            if (HIGHLIGHT_MAP.has(key)) {
              const group = HIGHLIGHT_MAP.get(key);
              nvim.command(`echomsg "[tigris] position: ${key} - Highlight groups: ${[group.join(', ')]}"`);
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

plugin.autocmd('VimEnter', {
  pattern: '*',
}, initialize);

plugin.autocmd('TextChangedI', {
  pattern: '*.js,*.jsx',
}, flyParse);

plugin.autocmd('TextChanged', {
  pattern: '*.js,*.jsx',
}, flyParse);

plugin.autocmd('BufEnter', {
  pattern: '*.js,*.jsx',
}, parse);

plugin.autocmd('BufRead', {
  pattern: '*.js,*.jsx',
}, parse);

plugin.autocmd('FileReadPost', {
  pattern: '*.js,*.jsx',
}, parse);

plugin.autocmd('InsertLeave', {
  pattern: '*.js,*.jsx',
}, parse);
