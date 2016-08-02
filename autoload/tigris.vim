" =============================================================================
" File: autoload/tigris.vim
" Author: Billy Vong <billy at mmo.me>
" License: MIT License
" based on original version by Shougo Matsushita <Shougo.Matsu at gmail.com>
" and Yanfei Guo <yanf.guo at gmail.com>
" =============================================================================

function! tigris#initialize() abort
    return tigris#init#_initialize()
endfunction

function! tigris#enable() abort
    if tigris#initialize()
        return 1
    endif
    return tigris#init#_enable()
endfunction

function! tigris#disable() abort
    call tigris#highlight#clear()
    return tigris#init#_disable()
endfunction

function! tigris#toggle() abort
    return tigris#init#_is_enabled() ? tigris#disable() : tigris#enable()
endfunction
" vim: tw=120:foldmarker={{{,}}}:foldmethod=marker:
