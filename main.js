(function() {

  var REVIEW_SERVER = 'https://quickoffice-internal-review.googlesource.com';
  var BASE_QUERY = REVIEW_SERVER + '/changes/?q=';

  var MASTER = 'branch:master';
  var OPEN = 'status:open';
  var CRX = 'file:crx';

  var WHO = {
    'Duncan' : 'owner:"dskelton"',
    'Dan' : 'owner:"dtilley"'
  };


  function init() {
    for(var name in WHO) {
      var p = document.createElement('p');
      p.innerText = name;
      document.body.appendChild(p)
      var query = WHO[name];

      request(genUrl(query))
        .then(handleCLs)
        .catch(handleError);
    }
  }

  function handleCLs(res) {
    for (var i = 0; i < res.length; i++) {
      var cl = res[i];
      var p = document.createElement('p');
      p.innerText = cl.subject;
      document.body.appendChild(p);
    }
  }

  function handleError(res) {
    console.error('Whoops: ', res);
  }

  function genUrl(who) {
    return BASE_QUERY + [MASTER, OPEN, CRX, who].join('+')
  }

  function request(url, type) {
    var type = type || 'GET';
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.onerror = function(evt) {
        reject(this.status);
      };

      xhr.onload = function(evt) {
        if (this.readyState === 4) {
          if (this.status === 200 && this.responseText) {
            var res = this.responseText;
            if (res.substring(0,4) === ")]}'") {
              res = JSON.parse(res.substring(4));
            }
            // console.log(res);
            resolve(res);
          } else if (this.status === 0 ||
            (this.status === 200 && !response)) {
            // Aborted, or null response with 'success' (200) code.
            // Obvserved to mean 'abort'.
            reject(new Error('HTTP ERROR: ABORTED'));
          } else {
            // Error
            this.onError_(evt);
          }
        }
      }
      xhr.open(type, url, true);
      // xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xhr.send();
    });
  }

  document.addEventListener("DOMContentLoaded", init, false);
})();
