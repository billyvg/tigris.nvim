'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// vim plugin vars
const ENABLE_VAR = exports.ENABLE_VAR = 'tigris#enabled';
const DEBUG_VAR = exports.DEBUG_VAR = 'tigris#debug';
const FLY_VAR = exports.FLY_VAR = 'tigris#on_the_fly_enabled';
const DELAY_VAR = exports.DELAY_VAR = 'tigris#delay'; // eslint-disable-line
const EXT_VAR = exports.EXT_VAR = 'tigris#extensions'; // eslint-disable-line

// default values
const DELAY_DEFAULT = exports.DELAY_DEFAULT = 500;
const EXT_DEFAULT = exports.EXT_DEFAULT = ['*.js', '*.jsx']; // eslint-disable-line
const ERR_ID = exports.ERR_ID = 12345;
const UPDATE_INTERVAL = exports.UPDATE_INTERVAL = 1000 * 60 * 60 * 6;

const PLUGIN_VARS = exports.PLUGIN_VARS = {
  ENABLE_VAR,
  DEBUG_VAR,
  FLY_VAR,
  DELAY_VAR,
  EXT_VAR
};