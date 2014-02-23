Conpherence.LoadingRoute = Ember.Route.extend
    activate: ->
        @_super()
        NProgress.start()
    
    deactivate: ->
        @_super()
        NProgress.done()