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
    var lastMatch = -1;
    sequence.forEach(function (element, i, array) {
      if (typeof element === 'string') {

        // not found implies insert after the last match
        //  this insertion is effectively the last match so we need to increment lastMatch anyhow
        var index = results.indexOf(element);
        if (index < 0) {
          results.splice(++lastMatch, 0, element);

        // backtracking is not allowed
        } else if (index < lastMatch) {
          throw new Error("The order of elements must be compatible between sequences.")

        // new match
        } else {
          lastMatch = index;
        }
      } else if (typeof element === 'function') {
        if (i < array.length - 1) {
          throw new Error('Methods are only permitted as the final element in the sequence.')
        } else if (methods.indexOf(element) < 0) {
          methods.push(element);
        }
      } else {
        throw new Error('Elements must be either string or function.')
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
 * The `before` method may return `void` to execute the pending sequence, or may return a new sequence based upon the
 * arguments it was given.
 * @param {number?} timeout The period to aggregate triggers over in milliseconds
 * @param {function?} filter A method to filter the aggregate sequence directly before it is run
 * @returns {{getHandler:function, enqueue:function, flush:function}}
 */
module.exports = function(timeout, filter) {
  'use strict';
  var milliseconds = Math.max(Number(timeout), 0) || 500;
  var safeFilter   = (typeof filter === 'function') ? filter : function() {};
  var queue        = [ ];
  function enqueue() {
    queue = merge(queue, Array.prototype.slice.call(arguments));
    clearTimeout(timeout);
    timeout = (queue.length) ? setTimeout(flush, milliseconds) : 0;
    return queue;
  }
  function flush() {
    var filtered = safeFilter.apply(null, queue) || queue;
    if (filtered.length) {
      runSequence.apply(null, filtered);
    }
    queue = [ ];
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