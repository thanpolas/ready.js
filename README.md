# ready.js

Watches over multiple async operations and triggers listeners when all or some are complete.

At only 854 bytes (gzip) ready.js is a powerful and tiny library that alllows you to manage and monitor multiple asynchronous operations, giving you total control of your application's execution flow.

Run ready.js on the **browser** and **node.js**!

## Contents

* [Getting Started](#getting_started)
* [The Concept](#the_concept)
* [Documentation](#documentation)
* [Examples](#examples)
* [License - Apache2](#license)

## Getting Started

### Browser version

[Get the latest browser version (0.7.0)](https://github.com/thanpolas/ready.js/raw/master/dist/ready.min.js).

### node.js version

`npm install asyncready.js` (*ready.js was taken*).

```javascript

var ready = require('asyncready.js');

```

## The Concept

* Each ready.js instance is a **ready watch**. Each *watch* can have one or multiple **checks**.
* All *Checks* have to finish in order to complete a *watch*.
* Listeners can be attached  on the completion of a single *check* or the completion of the whole *ready watch*.

Assume we have 4 asynchronous operations that need to run, and we want to execute x(), y() and z() functions when all 4 are complete.

First, we'll create a *ready watch*, let's name it `jobDone`.

```javascript
var r = ss.ready('jobDone');
```

The async operations are 2 db writes, 1 db read and 1 file operation. We'll have to create 4 *checks*.

```javascript
// our ready watch was stored in var r
r.addCheck('db_write_one');

// we can get the same ready watch every time we call ss.ready('jobDone')
ss.ready('jobDone')
    .addCheck('db_write_two') // ... and chain our method calls
    .addCheck('db_read_one')
    .addCheck('file_op_one');
```

So, at this point we have created the *ready watch* ('**jobDone**') and added 4 *checks* ('**db_write_one**', '**db_write_two**', '**db_read_one**' and '**file_op_one**').

Let's add some listeners on the *watch*.

```javascript
// As per our scenario we want to execute x, y and z functions:
var r = ss.ready('jobDone');
r.addListener(x)
    .addListener(y) // chain chain chain
    .addListener(z);
```

Awesome, we now have a *ready watch* with *checks* and listeners attached. Now, somewhere deep in our code, we do the async operations. When they are finished we want to inform our *ready watch* about it, so it knows when everything is finished and trigger the listeners.

```javascript
// let's check db write one first...
client.set('one', 'this is db write one', function(err, reply){
    /* Your stuff here */

    // declare db write one check is finished
    ss.ready('jobDone').check('db_write_one', 'we can pass', 'any number', 'of arguments');
});

/* In the meantime... */

// A cool feature with checks is that every added check on our
// ready watch creates a method with the name we used.
// So for cases where we don't want to create an anon func
// we can inline the check call like this:
client.set('two', 'this is db write two', ss.ready('jobDone').db_write_two);

/* Let's finish this up now... */

// two remaining checks todo, remember to call the checks in any outcome
// of your async operations, success or failure!
client.get('this_key_doesnt_exist', function(err, reply){
    /* handle your error but ALWAYS check your watch! */
    ss.ready('jobDone').check('db_read_on', false);
    // we passed a false argument so we can inform our
    // listeners of the false state
});

// the file read operation...
fs.read(fd, buffer, offset, length, position, function(err, bytesRead, buffer){
    /* do your magic */
    ss.ready('jobDone').check('file_op_one');
});
```

And that was it. Once all 4 *checks* are done, the *ready watch* will execute all attached listeners.

ready.js is pretty flexible, you can add listeners at any point in the lifespan of the *watch* and they will either queue up if the *watch* is not finished or if it's finished, synchronously execute.

## Documentation

In the browser, you can find ready.js in the `ss.ready` namespace, or if you run on node.js do a `require('asyncready.js');`.

### ss.ready(name | function, opt_forceInit)

**Returns**: Ready Instance

`ss.ready` creates a new *ready* instance or returns an existing one if it was previously initialized.

The `opt_forceInit` option is a boolean which if set to true, will force re-initialization of the *watch*. A nice example of how to use it can be found in [Example 3](#example-3-ready-watch-inside-a-repeative-callback).

If the first parameter is a *function* then `ss.ready` poses as [`.addListener`](#addlistenerfn) and attaches to the **'main'** watch. The *main watch* is hardcoded into the library and uses the name `main`.

You can access the default *'main'* watch with `ss.ready('main')` or plainly `ss.ready()`

### .addCheck(checkId)

**Returns**: Ready Instance

`.addCheck(checkId)` adds a *check* to the *ready watch*. Make sure `checkId` is a string or has a `.toString()` method.

Each *check* that is added, has to be *checked* (aka finished) with the [`.check(checkId)`](#checkcheckidvar_args) call.

`addCheck` returns the self instance so you can chain it.

Every *check* you add creates a new method in the instance using the `checkId` parameter as name. This new method is the same as calling `.check(checkId)`. See the example...

```javascript
var r = ss.ready('authDone');
r.addCheck('facebookDone');

r.addCheck('twitterDone')
    // let's try chaining...
    .addCheck('localDone');

/* Do your stuff, add listeners, etc */

// facebook finished
r.check('facebookDone');

// twitter finished, use the newly created
// method to declare it's done
r.twitterDone();
// do the same with local auth
r.localDone();

```

### .check(checkId, var_args)

**Returns**: Ready Instance

`.check(checkId)` declares that a *check* has finished.

`check` returns the self instance so you can chain it.

`check` can trigger execution of listeners if it's the last one of the *checks* to finish or if we have attached a [checkListener](#addchecklistenercheckid-fn) for this check.

You can pass any number or parameters and they can be accessed via the [getArgs](#getArgs) method.

### .addListener(fn, opt_selfObj)

**Returns**: Ready Instance

Adds a listener for the completion of the current *ready watch*. `fn` has to be a function.

`addListener` returns the self instance so you can chain it.

Optionally you can set an object to apply on the executed listener.

Each listener that is executed gets passed the Ready Instance as a parameter. The Ready Instance is particularly usefull to query ([getArgs](#getArgs)) for the parameters that were passed on each check that was executed.

```javascript
var r = ss.ready('appReady');
r.addCheck('DOM');
r.addCheck('auth');
r.addCheck('serverDataObjects');

// When our app is ready execute allDone to cleanup and update UI
ss.ready('appReady').addListener(allDone)
// load widgets when our app is ready
    .addListener(loadTwitter);
    // load calendar widget after app is ready
    .addListener(loadCalendar);

```

### .addCheckListener(checkId, fn, opt_selfObj)

**Returns**: Ready Instance

Adds a listener for the completion of the specified *check*.

`addCheckListener` returns the self instance so you can chain it.

Optionally you can set an object to apply on the executed listener.

Each Check listener that is executed has aguments as they were passed to the [check](#check_checkId_var_args) call.

```javascript
var r = ss.ready('go ready go');
// add a check
r.addCheck('theCheck');

// add a check listener
ss.ready('go ready go').addCheckListener(allDone)

// gotta love func expressions
function allDone(status, message) {
    status === true; // true
    message === 'foo'; // true too
}

/* ... */

// check the check
ss.ready('go ready go').theCheck(true, 'foo');
```

### .getArgs(checkId)

**Returns**: Array

Returns an array of arguments passed to a [check](#check) identified by *checkId*.

```javascript
var r = ss.ready('appReady');
r.addCheck('DOM');
r.addCheck('auth');

// declare our listener function
// 'ready' is the instance of the ready watch
var onAppReady = function(ready) {

    // get auth resolution
    var authArgs = ready.getArgs('auth');

    authArgs[0] === true; // true
    authArgs[1] === {nick: 'foo'}; // also true (if only we could deep compare)
};

ss.ready('appReady').addListener(onAppReady);

/* ... */
// listen for DOM ready event
var r = ss.ready('appReady');
jQuery.ready(r.DOM);

// our auth resolution function...
function userResolution(var_args) {
    // stuff
    // more stuff

    // oh we have an authed user, run check and
    // declare it
    ss.ready('appReady').check('auth', true, {nick: 'foo'});
}

```

### .isDone(), .isCheckDone(checkId)

`isDone` returns `boolean` if the *ready watch* has finished.

`isCheckDone` returns `boolean` if the specified *check* has finished.


### .dispose()

Will dispose all references to *checks*, *listeners*, everything, from the current instance.

### STATIC: ss.ready.reset()

**Hard core delete action!**

Will run `.dispose()` on all existing instances and remove any references to the instances.


## Examples

### Example 1: Our web application initializes...
```javascript

function appReady(ready) {
    /* do stuff */

    // check if facebook authed us
    if (ready.getArgs('facebookAuth')[0]) {
        // we are authed from FB
    }
}

// we'll use the main event to attach the appReady callback
ss.ready(appReady);

// load a few libs when app is ready
ss.ready(loadTwitter);
ss.ready(loadCalWidget);

// now add the checks that we want to watch
var r = ss.ready(); // ready with no params, returns the default 'main' watch

r.addCheck('DOM')
    .addCheck('facebookAuth')
    .addCheck('uiReady');

// attach to document ready event using jQuery and inline execute DOM check
$(document).ready(ss.ready().DOM);

/* ... */

// Listen for Facebook initial login status
FB.getLoginStatus(function(response){
    // check if we are authed with FB
    var isAuthed = 'connected' == response['status'];
    /* do your stuff */

    // Check facebook watch
    ss.ready().facebookAuth(isAuthed);
});

/* ... */

// when our UI is ready and responsive trigger the ui check
ss.ready().check('uiReady');

/* ... */

```

### Example 2: Listeners can be added after watch has finished
```javascript
var r = ss.ready('allDone');
r.addCheck('doneOne');
r.addCheck('doneTwo');

/* ... */

r.check('doneOne');
r.check('doneTwo');

/* ... */

r.addListener(function(ready){
    /* will execute synchronously as the ready watch has finished */
});
```

### Example 3: Ready watch inside a repeative callback
```javascript

/**
 * A callback method for an ajax call to our
 * server that has loaded a set of users.
 *
 * We have to render them and emit an event when
 * all ui / ux is done
 *
 * @param {Array.<Object>} allUsers an array with user objects
 * @return {void}
 */
users.prototype.renderUsers = function(allUsers) {
    // prepare our ready watch, force init as this is a repeative
    // call and we don't want to load previous state
    var r = ss.ready('usersRendered', true);

    // add checks for our two main operations
    r.addCheck('allParsed')
    r.addCheck('uiReady');

    // when all done execute _usersRenderFinished and apply
    // our current scope
    r.addListener(this._usersRenderFinished, this);

    // go through all users
    var user, userBlock;
    for (var i = 0, l = allUsers.length ; i < l ; i++) {
        // get the single user data object
        user = allUsers[i];
        // get the user markup block, from our awesome "class"
        userBlock = new UserBlock(user);

        // userBlock needs to load the user's image
        // and appear with a small animation fx on the DOM
        // dynamically create ready checks for these events
        r.addCheck('user-image-loaded' + user.id);
        r.addCheck('user-animation-finished' + user.id);

        // now attach the the userBlock's exposed events
        userBlock.listen('imageLoad', r['user-image-loaded' + user.id]);
        userBlock.listen('fxFinished', r['user-animation-finished' + user.id]);

        // remember, checks are also assigned as methods on our ready instance.
        //
        // Our unique to this user, checkId ('user-image-loaded' + user.id) let's suppose
        // it evaluates to 'user-image-loaded-444'. So this string literal has also been
        // assigned as a method to the ready instance 'r'.
        //
        // This means we can access it at r['user-image-loaded-444'] and execute
        // it using r['user-image-loaded-444']();

        // append our userBlock to the DOM
        $('#users-search-list').append(userBlock.render());
    }

    // loop finished, check 'allParased' and pass the user array
    r.check('allParsed', allUsers);
}

/**
 * When our UI has finished rendering and UX is done
 * call this function
 * @param {ss.ready} ready The ready instance
 * @return {void}
 */
users.prototype._usersRenderFinished = function(ready) {
    // re-enable our search button
    $('#button-search-users').removeAttr('disabled');

    // get the users array
    var args = ready.getArgs('allParsed');
    var allUsers = args[0];

    // now emmit an event that we are done
    ourEventEngine.trigger('users.searchRenderDone', allUsers);
};

```

## License
Copyright (c) 2012 Thanasis Polychronakis
Licensed under the [APACHE2 license](http://www.apache.org/licenses/LICENSE-2.0).
