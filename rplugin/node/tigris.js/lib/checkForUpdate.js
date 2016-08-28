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
  var notifier = (0, _updateNotifier2.default)({
    pkg: _package2.default,
    updateCheckInterval: _constants.UPDATE_INTERVAL
  });

  if (notifier && notifier.update) {
    if (nvim) {
      var updateMsg = '[tigris] Update available ' + notifier.update.current + ' →\n        ' + notifier.update.latest;

      debug(updateMsg);
      nvim.command('echomsg \'' + updateMsg + '\'');
      nvim.command('\n        echo \'[tigris]\' |\n        echon \' Update available \' |\n        echohl Comment |\n        echon \'' + notifier.update.current + '\' |\n        echohl None |\n        echon \' → \' |\n        echohl Keyword |\n        echon \'' + notifier.update.latest + '\' |\n        echohl None\n      ');
    }

    return notifier.update;
  }

  return null;
}