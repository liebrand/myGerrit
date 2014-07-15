
Polymer('butter-bar', {
  ready: function() {
    window.addEventListener('error', this.uncaughtException_.bind(this));
  },
  uncaughtException_: function(evt) {
    this.msg = evt.error.stack;
  }
});
