" =============================================================================
" File: autoload/tigris/util.vim
" Author: Billy Vong <billy at mmo.me>
" License: MIT License
" based on original version by Shougo Matsushita <Shougo.Matsu at gmail.com>
" and Yanfei Guo <yanf.guo at gmail.com>
" =============================================================================

function! tigris#util#set_default(var, val, ...)  abort
    if !exists(a:var) || type({a:var}) != type(a:val)
        let alternate_var = get(a:000, 0, '')

        let {a:var} = exists(alternate_var) ?
                    \ {alternate_var} : a:val
    endif
endfunction

function! tigris#util#print_error(string) abort
    echohl Error | echomsg '[tigris] ' . a:string | echohl None
endfunction

function! tigris#util#print_warning(string) abort
    echohl WarningMsg | echomsg '[tigris] ' . a:string | echohl None
endfunction

function! tigris#util#neovim_version() abort
    redir => v
    silent version
    redir END
    return split(v, '\n')[0]
endfunction

" vim: tw=120:foldmarker={{{,}}}:foldmethod=marker:
