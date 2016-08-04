" =============================================================================
" File: autoload/tigris/handlers.vim
" Author: Billy Vong <billy at mmo.me>
" License: MIT License
" based on original version by Shougo Matsushita <Shougo.Matsu at gmail.com>
" and Yanfei Guo <yanf.guo at gmail.com>
" =============================================================================

function! tigris#handlers#_init() abort
  echomsg "handlers init"
    augroup tigris
        autocmd!
        autocmd BufEnter *.js,*.jsx call _tigris_parse()
        autocmd InsertLeave * call _tigris_parse_debounced()
        autocmd TextChanged * call _tigris_parse_debounced()
        "autocmd CursorMoved * call tigris#handlers#_highlight()
        if get(g:, 'tigris#on_the_fly_enabled', 0)
            autocmd TextChangedI * call _tigris_parse_debounced()
        endif
    augroup END
endfunction

" vim: tw=120:foldmarker={{{,}}}:foldmethod=marker:
