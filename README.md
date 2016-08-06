# tigris.nvim (alpha)

tigris is a NodeJS remote plugin for Neovim that provides async syntax highlighting for
javascript (using [babylon][7]).

This project is largely inspired by [chromatica][1], which in turn is largely inspired by
[deoplete][2] and [color_coded][3].

## Features

* Accurate highlighting for modern javascript (ES6, flowtype, JSX)

![Comparison](/all.png?raw=true "Comparison")


## Prerequisites

* [Neovim][4]
* [Node.js][5], [Neovim Node.js host][8]

Tested on:

    * macOS 10.11.6, Neovim 0.1.5, Node.js 6.3.1

## Installation

### Install Vim Plugins

Use a plugin manager (vim-plug, Neobundle, dein, etc). `neovim/node-host` requires running `npm install`.
You may need to run `install.sh` in `tigris.nvim` as well.

#### vim-plug
```vim
Plug 'neovim/node-host', { 'do': 'npm install' }
Plug 'billyvg/tigris.nvim', { 'do': './install.sh' }
```

#### dein
```vim
call dein#add('neovim/node-host', { 'build': 'npm install' })
call dein#add('billyvg/tigris.nvim', { 'build': './install.sh' })
```

Or manually check out the repo and put the directory to your vim runtime path.

## Updating
Update plugins via git or plugin manager (i.e. with `vim-plug`: `:PlugUpdate`). Then `:UpdateRemotePlugins` and finally restart Neovim.

## How to use
You can use the `:TigrisStart` (as well as `:TigrisToggle`) command to parse your document once, and `:TigrisStop` to clear highlighting and disable parsing.

You can configure the parser to run at startup by

```vim
let g:tigris#enabled = 1
```

### Debugging
`:TigrisDebug` will give you information about what highlighting groups your current cursor position is in. You must have debug mode turned on first. You can then use these groups for your own highlighting.

```vim
let g:tigris#debug = 1
```

## On the fly highlighting
By default the plugin works as you change the buffer in Insert mode. Parsing is debounced with a 500ms delay (i.e. at most,
the parser will only run once every 500ms). You can change this delay or disable this completely. When disabled, the
parser will run when you enter a buffer or leave Insert mode.

```vim
let g:tigris#on_the_fly_enabled = 1
let g:tigris#delay = 500
```

Note that this may slowdown your system (especially with larger files) since it can potentially
be traversing the AST every 500ms.


## Known Issues
### Missing/incorrect highlights
Please open an issue as this project is still young and there are many things still missing/incorrect.

### Performance
This can be *SLOW*. Early measurements are around 400ms for 500 LoC on a 2015 MBP. I'm aiming for accuracy and completeness
before performance.

[1]: https://github.com/arakashic/chromatica.nvim
[2]: https://github.com/Shougo/deoplete.nvim
[3]: https://github.com/jeaye/color_coded
[4]: https://neovim.io
[5]: https://nodejs.org/en/
[7]: https://github.com/babel/babylon
[8]: https://github.com/neovim/node-host
