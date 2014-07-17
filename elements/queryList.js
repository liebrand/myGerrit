Polymer({
  ready: function() {

    chrome.storage.sync.get({
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