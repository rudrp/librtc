Conpherence.UsersController = Ember.ArrayController.extend
    usersCount: Ember.computed.alias 'model.length'
    sortProperties: ['name']
    sortAscending: true
    
    actions:
        call: (event) ->
            Conpherence.WebRTC.call event.get 'name'