# Ember transition animations.
Ember.View.reopen
    _viewWillDisappear: Ember.K
    _viewWillAppear: Ember.K
    _viewDidDisappear: Ember.K
    _viewDidAppeas: Ember.K

Ember.ContainerView.reopen
    _isPresentingView: false