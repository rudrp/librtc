# Set the default locale to be english. Must be done
# before initialising an ember application.
CLDR.defaultLocale = 'en'

window.Conpherence = Ember.Application.create
    LOG_TRANSITIONS: true
    LOG_TRANSITIONS_INTERNAL: true

Conpherence.ApplicationAdapter = Ember.WebSocketAdapter.extend
    version: 2