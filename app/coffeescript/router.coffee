Conpherence.Router.map ->
    @route 'missing', path: '/*path'

Conpherence.Router.reopen
    location: 'history'

Conpherence.MissingRoute = Ember.Route.extend
    redirect: ->
        @transitionTo '404'