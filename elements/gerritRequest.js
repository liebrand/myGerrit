(function() {
  REVIEW_SERVER = 'https://quickoffice-internal-review.googlesource.com',

  Polymer('gerrit-request', {

    type: 'GET',
    api: '',
    query: '',


    foo: function() {},

    ready: function() {
      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.onerror = function(evt) {
        document.body.appendChild(document.createTextNode('ERROR'));
        throw (this.status);
      };

      // keep hold of this gerrit request element
      // so that the on success of our xhr can fire on it
      var gerritRequest = this;

      xhr.onload = function(evt) {
        if (this.readyState === 4) {
          if (this.status === 200 && this.responseText) {
            var res = this.responseText;
            if (res.substring(0,4) === ")]}'") {
              res = JSON.parse(res.substring(4));
            }
            // console.log(res);
            // resolve(res);
            gerritRequest.fire('gerrit-response', {response: res, xhr: xhr});
          } else if (this.status === 0 ||
            (this.status === 200 && !response)) {
            // Aborted, or null response with 'success' (200) code.
            // Obvserved to mean 'abort'.
            throw new Error('HTTP ERROR: ABORTED');
          } else {
            // Error
            this.onerror(evt);
          }
        }
      }
      var url = REVIEW_SERVER + this.api + this.query;

      xhr.open(this.type, url, true);
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xhr.send();
    }
  });

})();

