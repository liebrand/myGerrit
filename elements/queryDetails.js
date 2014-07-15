Polymer('query-details', {
  publish: {
    favorite: {
      value: false,
      reflect: true
    }
  },
  favoriteTapped: function(event, detail, sender) {
    this.favorite = !this.favorite;
    this.fire('favorite-tap');
  },
  gerritResponse: function(evt, firedDetails, request) {
    // Make a copy of the loaded data
    this.cls = firedDetails.response.slice(0).sort(function(a, b) {
      return (a.owner.name < b.owner.name) ? -1 : 1;
    });
  }
});
