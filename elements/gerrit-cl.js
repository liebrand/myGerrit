
Polymer('gerrit-cl', {

  clTapped: function() {
    chrome.storage.sync.get({
      server: 'http://my.gerrit.server.com'
    }, function(items) {
      var openUrl = items.server + '/#/c/';
      var clNumber = this.details._number;
      window.open(openUrl + clNumber);
      // TODO(jliebrand): we never remove these items from local
      // storage... we should have some check to make sure we clear
      // this out if/when the CLs get closed
      window.localStorage.setItem(this.details._number, this.details.updated);
      window.location.reload();
    }.bind(this));
  },

  gerritResponse: function(evt, details) {
    this.details = details.response;
    var i;

    chrome.storage.sync.get({
      email: 'john@doe.com'
    }, function(items) {

      // determine if the cl should be bold (/ unread)
      if (this.details.messages) {
        // check if last message was mine
        var lastMessageIdx = this.details.messages.length - 1;
        var lastMessage = this.details.messages[lastMessageIdx];
        var lastMessageWasMe =
            (lastMessage && lastMessage.author &&
             lastMessage.author.email &&
             lastMessage.author.email === items.email);

        var notUpdated;
        var cachedUpdatedTimeStamp = window.localStorage.getItem(this.details._number);
        if (cachedUpdatedTimeStamp) {
          notUpdated = (cachedUpdatedTimeStamp === this.details.updated);
        }
        if (lastMessageWasMe || notUpdated) {
          // debugger;
          this.classList.add('read');
        } else {
          this.classList.remove('read');
        }

        // check if we have any try job success/failures
        var tryJobCss;
        for (i = 0; i < this.details.messages.length; i++) {
          var msg = this.details.messages[i];
          if (this.details.messages[i].message.match(/try job.*FAILURE/)) {
            tryJobCss = 'failure';
          } else if (this.details.messages[i].message.match(/try job.*SUCCESS/)) {
            tryJobCss = 'success';
          }
        }
        if (tryJobCss) {
          this.$.tryJob.classList.add(tryJobCss);
        }
      }

      // get the diffstat
      var totalChanges = this.details.deletions + this.details.insertions;
      this.diffstat = totalChanges;

      // set code review stats
      var score;
      if (this.details.labels["Code-Review"] &&
          this.details.labels["Code-Review"].all) {
        var reviewers = this.details.labels["Code-Review"].all;
        score = Math.max.apply(
            Math,reviewers.map(function(o){return o.value || 0;}))

        this.maxCodeReviewScore =
            ((score > 0) ? '+' : (score < 0) ? '-' : '') + score;
      }
      if (this.details.labels["Verified"] &&
          this.details.labels["Verified"].all) {
        var verifiers = this.details.labels["Verified"].all;
        score = Math.max.apply(
            Math,verifiers.map(function(o){return o.value || 0;}))

        this.maxVerifiedScore =
            ((score > 0) ? '+' : (score < 0) ? '-' : '') + score;
      }

    }.bind(this));

  }
});
