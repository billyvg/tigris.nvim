import updateNotifier from 'update-notifier';
import pkg from '../package.json';
import {
  UPDATE_INTERVAL,
} from './constants';

export default function checkForUpdates(nvim) {
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: UPDATE_INTERVAL,
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
