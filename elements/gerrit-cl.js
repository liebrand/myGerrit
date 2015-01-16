(function() {
  'use strict';

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

    // TODO(jliebrand): OMG this function REALLY needs to be split up in to
    // readable code!
    gerritResponse: function(evt, details) {
      this.details = details.response;
      var i;

      chrome.storage.sync.get({
        email: 'john@doe.com'
      }, function(extenionOptions) {

        this.setNewStatus_(extenionOptions);
        this.setReadStatus_(extenionOptions);
        this.setTryJobStatus_();
        this.setAge_();
        this.setDiffStat_();
        this.setScores_(extenionOptions);
        this.hideIfWIP_();

      }.bind(this));

    },

    // ----------------------------- PRIVATE -----------------------------

    /**
     * Sets the CL to new (css class 'new') if it has not got any comments from
     * this user
     *
     * @param {Object} extenionOptions the settings for this extension
     */
    setNewStatus_: function(extenionOptions) {
      if (this.everCommentedByMe_(extenionOptions)) {
        this.classList.add('new');
      }
    },


    /**
     * Sets this CL to bold (css class 'read') if either there has been a new
     * comment since the last time we opened it, or if the last comment was made
     * by this user, which could have been done outside of myGerrit opening it.
     *
     * @param {Object} extenionOptions the settings for this extension
     */
    setReadStatus_: function(extenionOptions) {
      if (this.lastCommentByMe_(extenionOptions) || !this.clHasBeenUpdated()) {
        this.classList.add('read');
      } else {
        this.classList.remove('read');
      }
    },


    /**
     * Sets the age of this CL
     */
    setAge_: function() {
      this.age = moment(new Date(this.details.created)).fromNow();
    },


    /**
     * Sets the diffstat for this CL
     */
    setDiffStat_: function() {
      var totalChanges = this.details.deletions + this.details.insertions;
      this.diffstat = totalChanges;
    },


    /**
     * Sets the code review scores (both review and verifiers)
     * @param {Object} extenionOptions the settings for this extension
     */
    setScores_: function(extenionOptions) {
      this.maxCodeReviewScore = this.calcReviewScore_(extenionOptions);
      this.maxVerifiedScore = this.calcVerifierScore_();
    },


    /**
     * Determines the status of the last try job
     */
    setTryJobStatus_: function() {
      // TODO(jliebrand): HACK until try jobs are better reported
      // in gerrit; for now HARDCODE the need for 8 success messages
      // on the highest patchset.
      var matches;
      var comments = this.getComments_();
      var tryJobResponses = comments.filter(this.commentIsTryJobResponse_);

      // find the latest patchset for which a tryjob ran
      var latestPatchset = -1;
      for (var i = 0; i < tryJobResponses.length; i++) {
        var response = tryJobResponses[i].message.toLowerCase();
        matches = response.match(/patch set (\d+)/);
        if (matches) {
          var patchset = parseInt(matches[1], 10);
          latestPatchset = Math.max(latestPatchset, patchset);
        }
      }

      // get all responses for that latest patchset only
      var latestResponses = tryJobResponses.filter(function(response) {
        var msg = response.message.toLowerCase();
        matches = msg.match(/patch set (\d+)/);
        return (matches && parseInt(matches[1], 10) === latestPatchset);
      });

      // now filter out the actual results from the responses
      var results = latestResponses.map(function(response) {
        var msg = response.message.toLowerCase();
        matches = msg.match(/patch set \d+(.|[\r\n])*try job has completed on .*:\s*(.*)/);
        return (matches && matches[2]);
      });
      // remove null and undefined results from our array
      results = results.filter(function(x) {return x;});

      // we could have run more than one try job on this patchset, in which case
      // we have more than 8 results...
      if (results.length > 8) {
        this.$.tryJob.classList.add('confused');
      } else {
        if (results.indexOf('failure') !== -1 || results.indexOf('exception') !== -1) {
          this.$.tryJob.classList.add('failure');
        } else {
          if (results.length === 8) {
            this.$.tryJob.classList.add('success');
          } else if (results.length > 0) {
            this.$.tryJob.classList.add('pending');
          }
        }
      }
    },


    /**
     * Hide this CL if the author has not yet added any reviewers to it; which
     * means this is still a Work In Progress CL...
     */
    hideIfWIP_: function() {
      var reviewers = this.getReviewers_();
      // this.style.display = (reviewers.length === 0) ? 'none' : 'block';
      if (reviewers.length === 0) {
        this.$.wipStatus.classList.add('wip');
      } else {
        this.$.wipStatus.classList.remove('wip');
      }
    },

    /**
     * @param {Object} extenionOptions the settings for this extension
     * @returns {boolean} true if this user has ever made a comment on this cl
     */
    everCommentedByMe_: function(extenionOptions) {
      var commentedByMe = false;
      var comments = this.getComments_();
      for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];

        if (comment && comment.author && comment.author.email &&
             comment.author.email === extenionOptions.email) {
          commentedByMe = true;
          break;
        }
      }
      return commentedByMe;
    },


    /**
     * @return {boolean} returns true if the CL has been updated since it was last
     *     opened from within myGerrit
     */
    clHasBeenUpdated: function() {
      var updated = true;
      var cachedUpdatedTimeStamp = localStorage.getItem(this.details._number);
      if (cachedUpdatedTimeStamp) {
        updated = (cachedUpdatedTimeStamp !== this.details.updated);
      }
      return updated;
    },


    /**
     * @param {Object} extenionOptions the settings for this extension
     * @return {boolean} returns true if the last comment was made by this user
     */
    lastCommentByMe_: function(extenionOptions) {
      var comments = this.getComments_();

      // find the last "real" comment (eg ignore tryJob status responses)
      var lastCommentIndex = comments.length - 1;
      var comment = comments[lastCommentIndex];
      while (lastCommentIndex > 0 && this.commentIsTryJobResponse_(comment)) {
        lastCommentIndex--;
      }

      var lastComment = this.details.messages[lastCommentIndex];
      var lastCommentWasByMe = (lastComment && lastComment.author &&
           lastComment.author.email &&
           lastComment.author.email === extenionOptions.email);
      return lastCommentWasByMe;
    },


    /**
     * @return the calculated score for an array of reviewers/verifiers. If any
     *     of them gave a negative score, that will be reported. Otherwise the
     *     the max score is returned
     *
     * @param {Array} reviewers an array of reviewers
     */
    calcScore_: function(reviewers) {
      var getValue = function(o) {return o.value || 0;}

      // check min score
      var score = Math.min.apply(Math, reviewers.map(getValue));

      // if no negative score, then get max score
      if (score === 0) {
        score = Math.max.apply(Math, reviewers.map(getValue));
      }

      if (score < 0) {
        this.classList.add('failedReview');
      }
      return score;
    },


    /**
     * @param {Object} extenionOptions the settings for this extension
     * @return {String} Calculate and return the reviewer score
     */
    calcReviewScore_: function(extenionOptions) {
      var reviewers = this.getReviewers_(extenionOptions);
      // show the minimume score if it is under zero; else show the
      // max score
      var score = this.calcScore_(reviewers);

      return this.stringifyScore_(score);
    },


    /**
     * @return {String} Calculate and return the verifier score
     */
    calcVerifierScore_: function() {
      if (this.details.labels["Verified"] &&
          this.details.labels["Verified"].all) {
        var verifiers = this.details.labels["Verified"].all;
        // show the minimume score if it is under zero; else show the
        // max score
        var score = this.calcScore_(verifiers);

        return this.stringifyScore_(score);
      }
    },


    /**
     * @return {Array} return an array of all the reviewers for this CL; note
     *     it will strip the author and quickoffice-bamboo users from the array
     */
    getReviewers_: function() {
      var reviewers = [];
      if (this.details.labels["Code-Review"] &&
          this.details.labels["Code-Review"].all) {
        reviewers = this.details.labels["Code-Review"].all;
      }
      return reviewers.filter(function(person) {
        return (person.email !== this.details.owner.email &&
            person.name.indexOf('quickoffice-bamboo') === -1);
      }, this);
    },

    /**
     * @return {String} stringify a score (add + sign if needed)
     */
    stringifyScore_: function(score) {
      return ((score > 0) ? '+' : '') + score;
    },


    /**
     * @returns {Array} returns an array of all the comments on this CL
     */
    getComments_: function() {
      return this.details.messages || [];
    },


    /**
     * @param {Object} comment the comment to inspect
     * @returns {boolean} returns true if the given comment is a tryJob response
     */
    commentIsTryJobResponse_: function(comment) {
      return (comment && comment.author &&
          comment.author.email === 'quickoffice-bamboo@google.com');
    }

  });

})();

