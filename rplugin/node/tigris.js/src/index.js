/**
 * Javascript syntax parsing with babylon
 *
 * @author Billy Vong <github at mmo.me>
 * @license MIT
 */
'use strict'; // eslint-disable-line
const parser = require('vim-syntax-parser').default;
const _ = require('lodash');
const regeneratorRuntime = require('regenerator-runtime/runtime'); // eslint-disable-line

// vim vars
const ENABLE_VAR = 'tigris#enabled';
// const AUTO_START_VAR = 'tigris#auto_enable';
const DEBUG_VAR = 'tigris#debug';
const DELAY_VAR = 'tigris#delay'; // eslint-disable-line
const FLY_VAR = 'tigris#on_the_fly_enabled';
const EXT_VAR = 'tigris#extensions'; // eslint-disable-line

// defaults
const DELAY_DEFAULT = 500;
const EXT_DEFAULT = ['*.js', '*.jsx']; // eslint-disable-line
const ERR_ID = 12345;

const DEBUG_MAP = new Map();
const HL_MAP = new Map();

// Check for updates
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
const promisify = require('promisify-node');

function checkForUpdates(nvim) {
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60 * 60 * 6,
  });

  if (notifier && notifier.update) {
    if (nvim) {
      const updateMsg = `[tigris] Update available ${notifier.update.current} →
        ${notifier.update.latest}`;

      debug(updateMsg);
      nvim.command(`echomsg '${updateMsg}'`);
      nvim.command(`
        echo '[tigris]' |
        echon ' Update available ' |
        echohl Comment |
        echon '${notifier.update.current}' |
        echohl None |
        echon ' → ' |
        echohl Keyword |
        echon '${notifier.update.latest}' |
        echohl None
      `);
    }

    return notifier.update;
  }

  return null;
}

const highlight = function(buffer, id, name, lineStart, columnStart, columnEnd, isDebug) {
  // Save highlighting group for debugging
  if (isDebug) {
    _.range(columnEnd - columnStart + 1).forEach((num) => {
      const key = `${lineStart + 1},${columnStart + num}`; // [lineStart, columnStart + num];
      if (!DEBUG_MAP.has(key)) {
        DEBUG_MAP.set(key, []);
      }
      const groups = DEBUG_MAP.get(key);
      groups.push(name);
      DEBUG_MAP.set(key, groups);
    });
  }
  return new Promise((resolve, reject) => {
    buffer.addHighlight(id, name, lineStart, columnStart, columnEnd, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

const parse = async function({ nvim, filename, clear } = {}) {
  const api = nvim;
  const prStart = +new Date();
  Object.keys(nvim).forEach((key) => {
    if (typeof nvim[key] === 'function') {
      api[key] = promisify(nvim[key]);
    }
  });
  debug(`Promisifiy overhead ${new Date() - prStart}`);

  if (!filename) {
    debug('ERROR NO FILENAME');
  }

  const _file = filename.split('/').pop();

  debug(`[${_file}] Parse called`);
  const start = +new Date();

  try {
    const enabled = await api.getVar(ENABLE_VAR);
    if (enabled) {
      const isDebug = await api.getVar(DEBUG_VAR);
      const buffer = await api.getCurrentBuffer();
      const lines = await buffer.getLines(0, -1, true);
      const newId = await buffer.addHighlight(0, '', 0, 0, 1);
      DEBUG_MAP.clear();
      let results;

      // Call parser
      debug(`[${_file}/${newId}] Calling tigris parser`);
      try {
        results = await parser(lines.join('\n'), {
          plugins: [
            'asyncFunctions',
            'asyncGenerators',
            'classConstructorCall',
            'classProperties',
            'decorators',
            'doExpressions',
            'exponentiationOperator',
            'exportExtensions',
            'flow',
            'functionSent',
            'functionBind',
            'jsx',
            'objectRestSpread',
            'trailingFunctionCommas',
          ],
        });
      } catch (err) {
        // Error parsing
        debug('Error parsing AST: ', err);
        nvim.callFunction('tigris#util#print_error', `Error parsing AST: ${err}`);

        // should highlight errors?
        if (err && err.loc) {
          // Clear previous error highlight
          buffer.clearHighlight(ERR_ID, 0, -1);
          buffer.addHighlight(ERR_ID, 'Error', err.loc.line - 1, 0, -1);
        }
      }

      if (results && results.length) {
        // Clear error highlight
        buffer.clearHighlight(ERR_ID, 0, -1);

        const highlightPromises = results.map((result) => {
          // wtb es6
          const type = result.type;
          const lineStart = result.lineStart;
          const columnStart = result.columnStart;
          const columnEnd = result.columnEnd;

          return highlight(
            buffer,
            newId,
            `js${type}`,
            lineStart - 1,
            columnStart,
            columnEnd,
            isDebug
          );
        });

        Promise.all(highlightPromises).then(() => {
          const end = +new Date();
          debug(`Parse time: ${end - start}ms`);

          if (clear) {
            _.range(1, newId - 2).forEach(num => {
              buffer.clearHighlight(num, 0, -1);
            });
          }

          if (filename) {
            const oldId = HL_MAP.get(filename);
            if (oldId) {
              debug(`[${_file}::${oldId}] Clearing old highlight`);
              buffer.clearHighlight(oldId, 0, -1);
            }

            HL_MAP.set(filename, newId);
          }
        }).catch((err) => {
          debug('Error highlighting', err, err.stack);
        });
      }
    }
  } catch (err) {
    debug('Error', err);
  }
};

function handleBufEnter(nvim, filename) {
  checkForUpdates(nvim);

  debug(`[${filename.split('/').pop()}] Handle buffer enter`);

  parse({ nvim, filename, clear: true });
}

function handleParse(nvim, filename) {
  parse({ nvim, filename });
}

const flyParse = _.debounce((nvim, filename) => {
  debug(`[${filename.split('/').pop()}] Fly parse called`);
  nvim.getVar(FLY_VAR, (err, enableFly) => {
    if (enableFly) {
      parse({ nvim, filename });
    }
  });
}, DELAY_DEFAULT);

const clear = (nvim) => {
  nvim.getCurrentBuffer((err, buffer) => {
    buffer.clearHighlight(-1, 0, -1);
  });

  DEBUG_MAP.clear();
};

const enable = (nvim) => {
  nvim.setVar(ENABLE_VAR, true, (err) => {
    if (!err) {
      parse({ nvim });
    }
  });
};

const disable = (nvim) => {
  nvim.setVar(ENABLE_VAR, false);

  clear(nvim);
};

plugin.function('_tigris_enable', (nvim) => {
  enable(nvim);
});

plugin.function('_tigris_disable', (nvim) => {
  disable(nvim);
});

plugin.function('_tigris_toggle', (nvim) => {
  nvim.getVar(ENABLE_VAR, (err, enabled) => {
    if (enabled) {
      disable(nvim);
    } else {
      enable(nvim);
    }
  });
});

plugin.function('_tigris_highlight_clear', (nvim) => {
  clear(nvim);
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
    parse({ nvim, args });
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
            if (DEBUG_MAP.has(key)) {
              const group = DEBUG_MAP.get(key);
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

/*
plugin.autocmd('VimEnter', {
  pattern: '*',
}, initialize);
*/

plugin.autocmd('TextChangedI', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")',
}, flyParse);

plugin.autocmd('TextChanged', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")',
}, flyParse);

plugin.autocmd('BufEnter', {
  pattern: '*.js,*.jsx',
  eval: 'expand("<afile>")',
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
  eval: 'expand("<afile>")',
}, handleParse);
