window.Conpherence = Ember.Application.create
    LOG_TRANSITIONS: true
    LOG_TRANSITIONS_INTERNAL: true
    rootElement: '#application'

Conpherence.ApplicationAdapter = DS.FixtureAdapter.extend({})