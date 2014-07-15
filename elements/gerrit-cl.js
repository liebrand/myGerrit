
Polymer('gerrit-cl', {

  clTapped: function() {
    console.log(this.details);
    var openUrl = 'https://quickoffice-internal-review.googlesource.com/#/c/';
    var clNumber = this.details._number;
    window.open(openUrl + clNumber);
    window.localStorage.setItem(this.details._number, this.details.updated);
    window.location.reload();
  },

  gerritResponse: function(evt, details) {
    this.details = details.response;
    var i;

    // determine if the cl should be bold (/ unread)
    if (this.details.messages) {
      // check if last message was mine
      var lastMessageIdx = this.details.messages.length - 1;
      var lastMessage = this.details.messages[lastMessageIdx];
      var lastMessageWasMe =
          (lastMessage && lastMessage.author &&
           lastMessage.author.email &&
           lastMessage.author.email === 'jliebrand@google.com');

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

    // set code review stats
    var score;
    if (this.details.labels["Code-Review"].all) {
      var reviewers = this.details.labels["Code-Review"].all;
      score = Math.max.apply(
          Math,reviewers.map(function(o){return o.value || 0;}))

      this.maxCodeReviewScore =
          ((score > 0) ? '+' : (score < 0) ? '-' : '') + score;
    }
    if (this.details.labels["Verified"].all) {
      var verifiers = this.details.labels["Verified"].all;
      score = Math.max.apply(
          Math,verifiers.map(function(o){return o.value || 0;}))

      this.maxVerifiedScore =
          ((score > 0) ? '+' : (score < 0) ? '-' : '') + score;
    }

  }
});
