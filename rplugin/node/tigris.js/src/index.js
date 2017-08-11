/**
 *
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
    parseFunc({ filename, clear: true });

  }
}, DELAY_DEFAULT);

@Plugin({
  name: 'tigris',
})
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

  @Command('TigrisClear')
  async clear() {
    const buffer = await this.nvim.buffer;
    this.nvim.outWrite('Clearing\n');
    buffer.clearHighlight({ srcId: -1 });
    DEBUG_MAP.clear();
  }

  @Function('tigris_parse_debounced')
  parseDebounced(args) {
    this.flyParse(args);
  }

  @Function('tigris_parse')
  parseFunc(args) {
    this.nvim.outWrite('vim func parse');
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
        console.log('Error with highlight debug, position doesnt exist');
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
    this.parse({ filename, clear: true });
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
    return ['nvim_buf_add_highlight', [buffer, id, name, lineStart, columnStart, columnEnd]];
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
          console.log(`babylon parse time: ${+new Date() - parseStart}ms`);
        } catch (err) {
          // Error parsing
          console.log('Error parsing AST: ', err);

          // should highlight errors?
          if (err && err.loc) {
            // Clear previous error highlight
            buffer.clearHighlight({ srcId: ERR_ID });
            buffer.addHighlight({ srcId: ERR_ID, hlGroup: 'Error', line: err.loc.line - 1, colStart: 0, colEnd: -1 });
          }
        }
        console.log(`Parser time: ${+new Date() - start}ms`);

        if (results && results.length) {
          // Clear error highlight
          buffer.clearHighlight({ srcId: ERR_ID });
          const [, err] = await this.nvim.callAtomic(results.map(({ type, lineStart, columnStart, columnEnd }) => {
            return this.highlight(
              buffer,
              newId,
              `js${type}`,
              lineStart - 1,
              columnStart,
              columnEnd,
              isDebug
            );
          }));

          buffer.clearHighlight({ srcId: newId - 1 });
          console.log(`Total time: ${+new Date() - start}ms`);

          if (clear) {
            _.range(1, newId - 1).forEach(num => {
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
  }
}

export default TigrisPlugin;
