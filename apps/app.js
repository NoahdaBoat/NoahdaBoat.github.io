// app.js — Entry point: wires all views/modals and initializes router

import * as Router from './js/router.js';

// Views
import { renderSleepList } from './js/views/sleep-list.js';
import { renderSleepForm } from './js/views/sleep-form.js';
import { renderSleepDetail } from './js/views/sleep-detail.js';
import { renderScreenList } from './js/views/screen-list.js';
import { renderScreenForm } from './js/views/screen-form.js';
import { renderTrends } from './js/views/trends.js';
import { renderSettings } from './js/views/settings.js';

// Register tab views
Router.registerView('sleep', renderSleepList);
Router.registerView('screens', renderScreenList);
Router.registerView('trends', renderTrends);
Router.registerView('settings', renderSettings);

// Register modals
Router.registerModal('sleep-form', renderSleepForm);
Router.registerModal('sleep-detail', renderSleepDetail);
Router.registerModal('screen-form', renderScreenForm);

// Boot
Router.init();
