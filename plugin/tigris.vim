" ============================================================================
" FILE: plugin/tigris.vim
" AUTHOR: Billy Vong <billy at mmo.me>
" License: MIT license
" ============================================================================
"
if exists('g:loaded_tigris')
    finish
endif

" if get(g:, 'tigris#enable_at_startup', 0) "{{{
    " augroup tigris
        " autocmd VimEnter * call tigris#enable()
    " augroup END
" endif "}}}

let s:script_folder_path = escape( expand( '<sfile>:p:h' ), '\'   )
execute('source '. s:script_folder_path . '/../syntax/tigris.vim')

let g:loaded_tigris=1

