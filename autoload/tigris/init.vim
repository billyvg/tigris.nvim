" =============================================================================
" File: autoload/tigris/init.vim
" Author: Billy Vong <billy at mmo.me>
" License: MIT License
" based on original version by Shougo Matsushita <Shougo.Matsu at gmail.com>
" and Yanfei Guo <yanf.guo at gmail.com>
" =============================================================================

if !exists('s:is_enabled')
    let s:is_enabled = 0
endif

function! tigris#init#_is_enabled() abort
    return s:is_enabled
endfunction

function! s:is_initialized() abort
    return exists('g:tigris#_channel_id')
endfunction

function! tigris#init#_initialize() abort
    " if s:is_initialized()
        " return
    " endif

    augroup tigris
        autocmd!
    augroup END

    if !has('nvim')
        call tigris#util#print_error(
                    \ 'tigris.nvim requires Neovim.')
        return 1
    endif

    call tigris#init#_variables()

    " try
        " if !exists('g:tigris#loaded_remote_plugin')
            " runtime! plugin/rplugin.vim
        " endif
        " call _tigris()
    " catch /^Vim\%((\a\+)\)\=:E117/
        " call tigris#util#print_error(
                    " \ 'tigris.nvim is not registered as Neovim remote plugins.')
        " call tigris#util#print_error(
                    " \ 'Please execute :UpdateRemotePlugins command and restart Neovim.')
        " return 1
    " catch
        " call tigris#util#print_error(
                    " \ 'There was an error starting Chromatica.')
        " return 1
    " endtry

    let s:is_enabled = g:tigris#enable_at_startup
    echomsg s:is_enabled
    if s:is_enabled
        call tigris#init#_enable()
    else
        call tigris#init#_disable()
    endif
endfunction

function! tigris#init#_enable() abort
    call tigris#handlers#_init()
    let s:is_enabled = 1
    " if get(g:, 'tigris#debug', 0) "{{{
        " call tigris#enable_logging('DEBUG', 'tigris.log')
    " endif "}}}

endfunction

function! tigris#init#_disable() abort
    augroup tigris
        autocmd!
    augroup END
    let s:is_enabled = 0
endfunction

function! tigris#init#_variables() abort
    " User variables
    call tigris#util#set_default(
                \ 'g:tigris#enable_at_startup', 1)
    call tigris#util#set_default(
                \ 'g:tigris#debug', 0)
    call tigris#util#set_default(
                \ 'g:tigris#on_the_fly_mode', 1)
    call tigris#util#set_default(
                \ 'g:tigris#delay_ms', 100)
endfunction

" vim: tw=120:foldmarker={{{,}}}:foldmethod=marker:
