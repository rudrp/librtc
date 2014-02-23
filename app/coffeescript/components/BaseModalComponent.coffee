Conpherence.BaseModalComponent = Ember.Component.extend
    isVisible: false
    
    actions:
        submit: (modal) ->
            @sendAction()
            
            # Fade out the modal view. Show() is necessary because
            # ember, for whatever reason hides the view if the
            # opacity is affected.
            @toggleProperty 'isVisible'
            @$().show()
    
    didInsertElement: ->
        @toggleProperty 'isVisible'