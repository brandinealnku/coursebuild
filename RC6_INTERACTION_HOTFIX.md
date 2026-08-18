# CourseBuild RC6.1 Interaction Hotfix

RC6 introduced a browser interaction regression through a MutationObserver feedback loop in `unified-modern-rc6.js`.

The observer watched `childList` mutations and called `normalizeLanguage()`. That function unconditionally reassigned the `#newProjectQuick` text, creating another child-list mutation and triggering the observer repeatedly. In the browser this could saturate the main thread and make navigation and buttons appear unresponsive.

RC6.1 makes the normalization idempotent, schedules observer work through `requestAnimationFrame`, cache-busts the RC6 assets, and adds a CI guard against reintroducing the original observer pattern.

Release verification should include pointer interaction for navigation tabs, course cards, + New course, modal cancel/close/create, Blueprint controls, readiness controls, and Settings.
