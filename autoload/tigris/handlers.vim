" =============================================================================
" File: autoload/tigris/handlers.vim
" Author: Billy Vong <billy at mmo.me>
" License: MIT License
" based on original version by Shougo Matsushita <Shougo.Matsu at gmail.com>
" and Yanfei Guo <yanf.guo at gmail.com>
" =============================================================================

function! tigris#handlers#_init() abort
  echomsg "handlers inint"
    augroup tigris
        autocmd!
        autocmd BufEnter *.js,*.jsx call _tigris#parse()
        autocmd InsertLeave * call tigris#parse_debounced()
        autocmd TextChanged * call tigris#parse_debounced()
        "autocmd CursorMoved * call tigris#handlers#_highlight()
        if get(g:, 'tigris#on_the_fly_enabled', 0)
            autocmd TextChangedI * call tigris#parse_debounced()
        endif
    augroup END
endfunction

" vim: tw=120:foldmarker={{{,}}}:foldmethod=marker:
