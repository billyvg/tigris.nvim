'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkForUpdates;

var _updateNotifier = require('update-notifier');

var _updateNotifier2 = _interopRequireDefault(_updateNotifier);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function checkForUpdates(nvim) {
  const notifier = (0, _updateNotifier2.default)({
    pkg: _package2.default,
    updateCheckInterval: _constants.UPDATE_INTERVAL
  });

  if (notifier && notifier.update) {
    if (nvim) {
      const updateMsg = `[tigris] Update available ${notifier.update.current} →
        ${notifier.update.latest}`;

      debug(updateMsg);
      nvim.command(`echomsg '${updateMsg}'`);
      nvim.command(`
        echo '[tigris]' |
        echon ' Update available ' |
        echohl Comment |
        echon '${notifier.update.current}' |
        echohl None |
        echon ' → ' |
        echohl Keyword |
        echon '${notifier.update.latest}' |
        echohl None
      `);
    }

    return notifier.update;
  }

  return null;
}