(function() {

  // Saves options to chrome.storage
  function save_options() {
    var email = document.getElementById('email').value;
    var queries = document.getElementById('queries').value;
    chrome.storage.sync.set({
      email: email,
      queries: queries
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }

  // Restores preferences values
  // stored in chrome.storage (use some examples as defaults)
  function restore_options() {
    chrome.storage.sync.get({
      email: 'john@doe.com',
      queries: 'branch:master+status:open,\n' +
               'branch:master+status:open+is:starred'
    }, function(items) {
      document.getElementById('email').value = items.email;
      document.getElementById('queries').value = items.queries;
    });
  }

  function init() {
    document.getElementById('save').addEventListener('click',
        save_options);
    restore_options();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

