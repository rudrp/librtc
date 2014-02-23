Conpherence.UsersView = Ember.CollectionView.extend
    itemViewClass: Conpherence.UserListItemView
    contentBinding: 'controller'
    tagName: 'ul'
    