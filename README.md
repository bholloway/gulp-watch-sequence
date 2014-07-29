# gulp-watch-sequence

> Merge the actions of multiple watch triggers into a single common sequence.

## Install

Install with [npm](https://npmjs.org/package/gulp-watch-sequence).

```
npm install --save-dev gulp-watch-sequence
```

## Usage

The the following example we are watching both javascript and css.

It is possible (using save-all in our IDE) that both will trigger in close succession. However we wish the 'html' and
'reload' tasks to be performed only once.
 
Both will fire the different handlers that we have obtained for them and be merged on the queue. The queue is flushed
300 milliseconds following.

```js
var gulp = require('gulp');
var watch = require('gulp-watch');
var sequence = require('gulp-watch-sequence');

gulp.task('watch', function () {
  var queue = sequence(300);

  watch({
    name: 'JS',
    emitOnGlob: false,
    glob: 'src/**/*.js'
  }, queue.getHandler('js', 'html', 'reload'));

  watch({
    name: 'CSS',
    emitOnGlob: false,
    glob: 'scss/**/*.scss'
  }, queue.getHandler('css', 'html', 'reload'));
});
```

## Reference

### (timeout, before)

Get an instance for the given timeout value.

Sequences triggered within the timeout will share the same sequence run, delayed by at most `timeout` milliseconds.

The `before` method may return `void` to execute the pending sequence, or may return a new sequence based upon the
arguments it was given.

@param `{number?} timeout` The period to aggregate triggers over in milliseconds.

@param `{function?} filter` A method to filter the aggregate sequence directly before it is run.

@returns `{{getHandler:function, enqueue:function, flush:function}}`

### .getHandler(...)

Get a `gulp-watch` handler for the given sequence.

@param `{...string}` A sequence of gulp tasks to run.

@return `{function}` A <code>gulp-watch</code> handler method that will enqueue the given sequence.

### .enqueue(...)

Manually enqueue the given sequence of gulp tasks, possibly including `done` callback.

@param `{...string|function}` A sequence of gulp tasks to run, with optional trailing callback.

@returns `{array.<string|function}` The current value of the aggregate sequence.

### .flush()

Manually trigger the currently aggregated sequence of tasks.
