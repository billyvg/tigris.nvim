'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// vim plugin vars
var ENABLE_VAR = exports.ENABLE_VAR = 'tigris#enabled';
var DEBUG_VAR = exports.DEBUG_VAR = 'tigris#debug';
var FLY_VAR = exports.FLY_VAR = 'tigris#on_the_fly_enabled';
var DELAY_VAR = exports.DELAY_VAR = 'tigris#delay'; // eslint-disable-line
var EXT_VAR = exports.EXT_VAR = 'tigris#extensions'; // eslint-disable-line

// default values
var DELAY_DEFAULT = exports.DELAY_DEFAULT = 500;
var EXT_DEFAULT = exports.EXT_DEFAULT = ['*.js', '*.jsx']; // eslint-disable-line
var ERR_ID = exports.ERR_ID = 12345;
var UPDATE_INTERVAL = exports.UPDATE_INTERVAL = 1000 * 60 * 60 * 6;

var PLUGIN_VARS = exports.PLUGIN_VARS = {
  ENABLE_VAR: ENABLE_VAR,
  DEBUG_VAR: DEBUG_VAR,
  FLY_VAR: FLY_VAR,
  DELAY_VAR: DELAY_VAR,
  EXT_VAR: EXT_VAR
};