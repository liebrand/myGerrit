Polymer({
  ready: function() {

    // this.queries = window.localStorage.getItem('queries') ||
    //   'branch:master+status:open,\n' +
    //   'branch:master+status:open+is:starred';
    // this.queries = ['x', 'f'];
// debugger;
      chrome.storage.sync.get({
        email: 'john@doe.com',
        queries: 'branch:master+status:open,\n' +
                 'branch:master+status:open+is:starred'
      }, function(items) {
        // remove any new lines from the query text:
        var q = items.queries.replace(/\r?\n|\r/g, '')

        // now put them in an array
        this.queries = q.split(',');
      }.bind(this));


  }
});
