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
    var res = firedDetails.response;
    if (Object.prototype.toString.call(res) === '[object String]') {
      if (res.indexOf('login') !== -1) {
        // assume login issue
        throw new Error('Not logged in to Gerrit ?');
      } else {
        throw new Error('unexpected Gerrit response');
      }
    } else {
      // Make a copy of the loaded data
      this.cls = res.slice(0).sort(function(a, b) {
        var aCreated = new Date(a.created);
        var bCreated = new Date(b.created);

        return (aCreated < bCreated) ? -1 : 1;
      });
    }
  }
});