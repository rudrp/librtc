Conpherence.Router.map ->
    @resource 'users', path: '/'
    @route 'missing', path: '/*path'

Conpherence.Router.reopen
    location: 'history'

Conpherence.MissingRoute = Ember.Route.extend
    redirect: ->
        @transitionTo '404'