var runSequence = require('run-sequence');

/**
 * Merge sequences that have compatible ordering.
 * @param {...Array.<string|function>} Any number of sequences to merge
 * @returns {Array.<string|function>} A single merged array, preserving order
 */
function merge() {
  'use strict';
  var methods = [ ];
  var results = [ ];

  // for each sequence in the arguments
  var sequences = Array.prototype.slice.call(arguments);
  sequences.forEach(function (sequence) {

    // for each element in the sequence
    var lastMatch = 0;
    sequence.forEach(function (element) {

      // not found implies insert after the last match
      //  this insertion is effectively the last match so we need to increment lastMatch anyhow
      var index = list.indexOf(element);
      if (index < 0) {
        results.splice(++lastMatch, 0, element);

        // backtracking is not allowed
      } else if (index < lastMatch) {
        throw new Error("The order of elements must be compatible between sequences.")

        // new match
      } else {
        lastMatch = index;
      }
    })
  })

  // append a handler that calls all methods
  if (methods.length) {
    results.push(function () {
      methods.forEach(function (method) {
        method.call();
      });
    })
  }

  // complete
  return results;
}

/**
 * Get an instance for the given timeout value.
 * Sequences triggered within the timeout will share the same sequence run, delayed by at most <code>timeout</code>
 * milliseconds.
 * @param {number?} timeout The period to aggregate triggers over in milliseconds
 * @param {function?} handler A method to use in place of <code>run-sequence</code>
 * @returns {{get:function, trigger:function}}
 */
module.exports = function(timeout, handler) {
  'use strict';
  var milliseconds = Math.max(Number(timeout), 0) || 500;
  var queue        = [ ];
  function enqueue() {
    queue = merge(queue, Array.prototype.slice.call(arguments));
    clearTimeout(timeout);
    timeout = (queue.length) ? setTimeout(trigger, millseconds) : 0;
    return queue;
  }
  function flush() {
    if (queue.length) {
      (handler || runSequence).apply(null, queue);
      queue = [ ];
    }
  }
  return {

    /**
     * Get a <code>gulp-watch</code> handler for the given sequence.
     * @param {...string} A sequence of gulp tasks to run
     * @return {function} A <code>gulp-watch</code> handler method that will enqueue the given sequence
     */
    getHandler: function () {
      var sequence = Array.prototype.slice.call(arguments);
      return function(files, done) {
        enqueue.apply(null, sequence.concat(done));
      }
    },

    /**
     * Manually enqueue the given sequence of gulp tasks, possibly including <code>done</code> callback.
     * @param {...string|function} A sequence of gulp tasks to run, with optional trailing callback
     * @returns {array.<string|function} The current value of the aggregate sequence
     */
    enqueue: enqueue,

    /**
     * Manually trigger the currently aggregated sequence of tasks.
     */
    flush: flush
  }
}