# tigris.nvim (alpha)

tigris is a NodeJS remote plugin for Neovim that provides async syntax highlighting for
javascript (using [babylon][7]).

This project is largely inspired by [chromatica][1], which in turn is largely inspired by
[deoplete][2] and [color_coded][3].

## Features

* Accurate highlighting for modern javascript (ES6, flowtype, JSX)

## Prerequisites

* [Neovim][4]
* [Node.js][5], [Neovim Node.js host][8] and [Neovim Node.js client][6]

Tested on:

    * macOS 10.11.6, Neovim 0.1.5, Node.js 6.3.1

## Installation

### Install Prerequisites

```bash
npm install -g neovim-client
```

### Install Vim Plugins

Use a plugin manager (for example, Neobundle, dein, etc). `neovim/node-host` requires running npm install.

```vim
NeoBundle 'neovim/node-host'
NeoBundle 'billyvg/tigris.nvim'
```

Or manually check out the repo and put the directory to your vim runtime path.

## On the fly highlighting
By default the plugin works as you change the buffer in Insert mode. Parsing is debounced with a 100ms delay (i.e. at most,
the parser will only run once every 100ms). You can change this delay or disable this completely. When disabled, the
parser will run when you enter a buffer or leave Insert mode.

```vim
let g:tigris#on_the_fly_enabled=0
let g:tigris#delay=50
```

Note that this may slowdown your system (especially with larger files) since it can potentially
be traversing the AST every 100ms.


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
[6]: https://github.com/neovim/node-client
[7]: https://github.com/babel/babylon
