
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
        // check if last message was mine (and ignore try jobs)
        function msgIsTryJob_(msgs, idx) {
          var lastMessage = msgs[lastMessageIdx];
          return (lastMessage && lastMessage.author &&
              lastMessage.author.email === 'quickoffice-bamboo@google.com');
        }

        var lastMessageIdx = this.details.messages.length - 1;
        while (lastMessageIdx > 0 && msgIsTryJob_(this.details.messages, lastMessageIdx)) {
          lastMessageIdx--;
        }

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
        // and also check if I have made any comments at all
        var everCommentedByMe = false;
        var tryJobCss;
        var tryJobsPatchsets = {};

        for (i = 0; i < this.details.messages.length; i++) {
          var msg = this.details.messages[i];

          everCommentedByMe = everCommentedByMe ||
              (msg && msg.author &&
               msg.author.email &&
               msg.author.email === items.email);

          var matches = msg.message.toLowerCase().match(/patch set (\d+)(.|[\r\n])*!tryjob/);

          if (matches) {
            // new request for patch set; clear old gathered data
            tryJobsPatchsets[matches[1]] = {};
          }

          matches = msg.message.toLowerCase().match(/patch set (\d+)(.|[\r\n])*try job has (\S*).*:\s*(.*)/);
          if (matches) {
            var patchSet = matches[1];
            var legacyTryJob = matches[3] === 'finished';
            var result = matches[4];
            tryJobsPatchsets[patchSet] = tryJobsPatchsets[patchSet] || {};
            tryJobsPatchsets[patchSet].legacy = legacyTryJob;
            tryJobsPatchsets[patchSet][result] = ++tryJobsPatchsets[patchSet][result] || 1;
          }
        }

        // TODO(jliebrand): HACK until try jobs are better reported
        // in gerrit; for now HARDCODE the need for 8 success messages
        // on the highest patchset.
        var patchSets = Object.keys(tryJobsPatchsets).sort(function(a,b) {return a-b;});
        if (patchSets.length > 0) {
          var highestPatchset = patchSets.pop();
          var tryJob = tryJobsPatchsets[highestPatchset];

          if (tryJob.legacy) {
            tryJobCss = (tryJob.success === 1) ?
              'success' : 'failure';
          }
          else {
            tryJobCss = (tryJob.success === 8) ?
              'success' : (tryJob.failure || tryJob.exception) ? 'failure' : 'pending';
          }
        }

        if (tryJobCss) {
          this.$.tryJob.classList.add(tryJobCss);
        }
        if (!everCommentedByMe) {
          this.classList.add('new');
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
        // show the minimume score if it is under zero; else show the
        // max score
        score = Math.min.apply(
            Math,reviewers.map(function(o){return o.value || 0;}))
        if (score === 0) {
          score = Math.max.apply(
              Math,reviewers.map(function(o){return o.value || 0;}))
        }

        if (score < 0) {
          this.classList.add('failedReview');
        }
        this.maxCodeReviewScore =
            ((score > 0) ? '+' : '') + score;
      }
      if (this.details.labels["Verified"] &&
          this.details.labels["Verified"].all) {
        var verifiers = this.details.labels["Verified"].all;
        // show the minimume score if it is under zero; else show the
        // max score
        score = Math.min.apply(
            Math,verifiers.map(function(o){return o.value || 0;}))
        if (score === 0) {
          score = Math.max.apply(
              Math,verifiers.map(function(o){return o.value || 0;}))
        }

        if (score < 0) {
          this.classList.add('failedReview');
        }
        this.maxVerifiedScore =
            ((score > 0) ? '+' : '') + score;
      }

    }.bind(this));

  }
});
