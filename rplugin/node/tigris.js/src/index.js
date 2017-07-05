/**
 * Javascript syntax parsing with babylon
 *
 * @author Billy Vong <github at mmo.me>
 *
 * @license MIT
 */
import _ from 'lodash';
import parser from 'vim-syntax-parser';

import {
  Plugin, Function, Autocmd, Command,
} from 'neovim';

// Check for updates
// import checkForUpdates from './checkForUpdate';

import {
  ENABLE_VAR,
  DEBUG_VAR,
  FLY_VAR,
  DELAY_DEFAULT,
  ERR_ID,
} from './constants';

const DEBUG_MAP = new Map();
const HL_MAP = new Map();


const debouncedParser = _.debounce.call(_, async (nvim, filename, parseFunc) => {
  const enableFly = await nvim.getVar(FLY_VAR);

  console.log(`[${filename.split('/').pop()}] Fly parse enabled: ${enableFly}`);

  if (enableFly) {
    parseFunc({ filename });
  }
}, DELAY_DEFAULT);

@Plugin({ dev: true })
class TigrisPlugin {
  flyParse(filename) {
    debouncedParser(this.nvim, filename, this.parse.bind(this));
  }

  @Function('tigris_enable')
  async enable() {
    await this.nvim.setVar(ENABLE_VAR, true);
    this.parse();
  }

  @Function('tigris_disable')
  disable() {
    this.nvim.setVar(ENABLE_VAR, false);
    this.clear();
  }

  @Function('tigris_toggle')
  async toggle() {
    const enabled = await this.nvim.getVar(ENABLE_VAR);
    if (enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  @Function('tigris_highlight_clear')
  async clear() {
    const buffer = await this.nvim.buffer;
    buffer.clearHighlight({ srcId: -1 });
    DEBUG_MAP.clear();
  }

  @Function('tigris_parse_debounced')
  parseDebounced(args) {
    this.flyParse(args);
  }

  @Function('tigris_parse')
  parseFunc(args) {

    console.log('vim func parse');
    try {
      this.parse({ args });
    } catch (err) {
      console.log(err, err.stack);
    }
  }

  @Command('TigrisDebug')
  async highlightDebug() {
    const isDebug = await this.nvim.getVar(DEBUG_VAR);
    if (isDebug) {
      const win = await this.nvim.window;
      const pos = await win.cursor;
      const key = `${pos[0]},${pos[1]}`;
      if (DEBUG_MAP.has(key)) {
        const group = DEBUG_MAP.get(key);
        this.nvim.command(
          `echomsg "[tigris] position: ${key} - Highlight groups: ${[group.join(', ')]}"`
        );
      } else {
        this.nvim.command(
          'echomsg "[tigris] Error, position doesn\'t exist"'
        );
        console.log('Error with highlight console.log, position doesnt exist');
      }
    } else {
      this.nvim.command('echomsg "[tigris] console.log mode not enabled: `let g:tigris#console.log=1` to enable"');
    }
  }

  @Autocmd('TextChangedI', {
    pattern: '*.js,*.jsx',
    eval: 'expand("<afile>")',
  })
  onTextChangedI(args) {
    this.flyParse(args);
  }

  @Autocmd('TextChanged', {
    pattern: '*.js,*.jsx',
    eval: 'expand("<afile>")',
  })
  onTextChanged(args) {
    this.flyParse(args);
  }
  @Autocmd('BufEnter', {
    pattern: '*.js,*.jsx',
    eval: 'expand("<afile>")',
  })
  async onBufEnter() {
    const filename = await this.nvim.buffer.name;
    console.log(`[${filename.split('/').pop()}] Handle buffer enter`);
    this.parse({ filename, clear: true });
  }

  @Autocmd('InsertLeave', {
    pattern: '*.js,*.jsx',
    eval: 'expand("<afile>")',
  })
  onInsertLeave(filename) {
    this.parse(filename);
  }

  highlight(buffer, id, name, lineStart, columnStart, columnEnd, isDebug) {
    // Save highlighting group for console.logging
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
    return buffer.addHighlight({
      srcId: id, hlGroup: name, line: lineStart, colStart: columnStart, colEnd: columnEnd,
    });
  }

  async parse({ filename, clear } = {}) {
    try {
      const start = +new Date();
      const _file = filename && filename.split('/').pop() || '';
      console.log(`[${_file}] Parse called`);

      const enabled = await this.nvim.getVar(ENABLE_VAR);

      if (enabled) {
        const isDebug = await this.nvim.getVar(DEBUG_VAR);
        const buffer = await this.nvim.buffer;
        const lines = await buffer.lines;
        const newId = await buffer.addHighlight({ srcId: 0, hlGroup: '', line: 0, colStart: 0, colEnd: 1 });
        console.log(`new id: ${newId}, ${typeof newId}`);
        DEBUG_MAP.clear();
        let results;

        // Call parser
        console.log(`[${_file}/${newId}] Calling tigris parser`);
        try {
          const parseStart = +new Date();
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
          console.log(`babylon parse time: ${+new Date() - parseStart}`);
        } catch (err) {
          // Error parsing
          console.log('Error parsing AST: ', err);
          this.nvim.callFunction('tigris#util#print_error', `Error parsing AST: ${err}`);

          // should highlight errors?
          if (err && err.loc) {
            // Clear previous error highlight
            buffer.clearHighlight({ srcId: ERR_ID });
            buffer.addHighlight({ srcId: ERR_ID, hlGroup: 'Error', line: err.loc.line - 1, colStart: 0, colEnd: -1 });
          }
        }

        if (results && results.length) {
          // Clear error highlight
          buffer.clearHighlight({ srcId: ERR_ID });

          const highlightPromises = results.map((result) => {
            // wtb es6
            const type = result.type;
            const lineStart = result.lineStart;
            const columnStart = result.columnStart;
            const columnEnd = result.columnEnd;

            return this.highlight(
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
            console.log(`Parse time: ${end - start}ms`);

            if (clear) {
              _.range(1, newId - 2).forEach(num => {
                buffer.clearHighlight({ srcId: num });
              });
            }

            if (filename) {
              const oldId = HL_MAP.get(filename);
              if (oldId) {
                // console.log(`[${_file}::${oldId}] Clearing old highlight`);
                buffer.clearHighlight({ srcId: oldId });
              }

              HL_MAP.set(filename, newId);
            }
          }).catch((err) => {
            console.log('Error highlighting', err, err.stack);
          });
        }
      }
    } catch (err) {
      console.log('Error parsing', err);
    }
  }
}

export default TigrisPlugin;
