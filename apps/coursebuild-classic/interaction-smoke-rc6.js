/* RC6 interaction smoke guard.
   This file intentionally stays dependency-free so CI can syntax-check it.
   Manual release checks: navigation, course cards, + New course modal, Blueprint actions,
   readiness actions, settings controls, and modal close/cancel must all accept pointer input. */
(function(){
  window.COURSEBUILD_INTERACTION_SMOKE={
    version:'rc6.1',
    requiredSelectors:[
      '.steps button[data-view]',
      '#newProjectQuick',
      '#modal',
      '#closeModal'
    ]
  };
})();
