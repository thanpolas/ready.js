# ready.js

Watches over multiple async operations and triggers listeners when all or some are complete.

At only 825 bytes (gzip) ready.js is a powerful and tiny library that alllows you to manage and monitor multiple asynchronous operations, giving you total control of your application's execution flow.

ready.js runs both on the browser and node.js

## Getting Started

### Browser version

[Get the latest browser version (0.6.4)](https://github.com/thanpolas/ready.js/raw/master/dist/ready.min.js).

### node.js version

`npm install asyncready.js` (ready.js was taken).

```javascript

var ready = require('asyncready.js');

```

[Check out the source](https://github.com/thanpolas/ready.js/blob/master/lib/ready.js) and the same source [adapted to run on node.js](https://github.com/thanpolas/ready.js/blob/master/dist/ready.node.js).


## The Concept

* ready.js has **ready watches**. Each *watch* can have one or multiple **checks**.
* All *Checks* have to finish in order to complete a *watch*.
* Listeners can be attached  on the completion of a single *check* or the completion of the whole *ready watch*, when all *cheks* are done.

Assume we have 4 asynchronous operations that need to run, and we want to execute xyz methods when all 4 complete.

We will create a *ready watch*, let's name it `jobDone`.

```javascript
var r = ss.ready('jobDone');
```

As per our scenario, we want to watch the execution of 4 async operations. Say they are 2 db writes, 1 db read and 1 file operation. We'll have to create 4 *checks*.

```javascript
// our ready watch was stored in var r
r.addCheck('db_write_one');

// we can get the same ready watch every time we call ss.ready('jobDone')
ss.ready('jobDone')
    .addCheck('db_write_two'); // ... and chain our method calls

// addCheck methods can be chained
r.addCheck('db_read_one')
    .addCheck('file_op_one');
```

So, at this point we have created our *ready watch* ('jobDone') and added 4 *checks* ('db_write_one', 'db_write_two', 'db_read_one' and 'file_op_one'). Let's add some listeners on the *watch* that will trigger when everything has finished.

```javascript
// As per our scenario we want to execute xyz methods when
// our ready watch finishes. So, xyz, are actually x(), y()
// and z() which are in our context:
var r = ss.ready('jobDone');
r.addListener(x);
// addListener methods cannot be chained as they return a string
// we'll talk later about that... However we can chain this way to
// avoid a variable declaration:
ss.ready('jobDone').addListener(y);
ss.ready('jobDone').addListener(z);
```

Awesome, we now have a *ready watch* with *checks* and listeners attached. Now, somewhere deep in our code, we do the async operations. When they are finished we want to inform our *ready watch* about it so it can check if everything is finished and trigger our listeners. Here is how we do it:

```javascript
// let's check db write one first...
client.set('one', 'this is db write one', function(err, reply){
    /* Your stuff here */

    // declare db write one check is finished
    ss.ready('jobDone').check('db_write_one');
});

/* In the meantime... */

// A cool feature with checks is that every added check on our
// ready watch creates a method with the name we used.
// So for cases where we don't care about the callback's parameters we can
// inline the check call like this:
client.set('two', 'this is db write two', ss.ready('jobDone').db_write_two);

/* Let's finish this up now... */

// two remaining checks todo, remember to call the checks in any outcome
// of your async operations, success or failure!
client.get('this_key_doesnt_exist', function(err, reply){
    /* handle your error but ALWAYS check your watch! */
    ss.ready('jobDone').check('db_read_on');
});

// the file read...
fs.read(fd, buffer, offset, length, position, function(err, bytesRead, buffer){
    /* do your magic */
    ss.ready('jobDone').check('file_op_one');
});
```

And that was it. Once all 4 *checks* are done the *ready watch* will execute all attached listeners. ready.js is pretty flexible, you can add listeners at any point in the lifespan of the *watch* and they will either queue up if the *watch* is not finished or synchronously execute if the *watch* is finished. You can also add listeners on single *checks*. Read bellow for the full API documentation.


## Documentation

In the browser, you can find ready.js in the `ss.ready` namespace, or as mentioned above, if you run on node.js do a `require('asyncready.js');` to get the library.

### ss.ready(name | function, opt_forceInit)

`ss.ready` creates a new *ready* instance or returns an existing one if previously initialized.

If the first parameter is a *function* then `ss.ready` poses as [`.addListener`](#addlistenerfn) and attaches to the **'main'** watch. The *main watch* is hardcoded into the library and uses the name `main`.

You can access the default *'main'* watch with `ss.ready('main')` or plainly `ss.ready()`

The `opt_forceInit` option is a boolean which if set to true, will force re-initialization of the *watch*. A nice example of how to use it can be found in [Example 3](#example-3-ready-watch-inside-a-repeative-callback).

### .addCheck(checkId)

`.addCheck(checkId)` adds a *check* to the *ready watch*. Make sure `checkId` is a string or has a `.toString()` method.

Each *check* that is added, has to be *checked* (aka finished) with the [`.check(checkId)`](#checkcheckid) call.

`addCheck` returns the self instance so you can chain it.

Every *check* you add creates a new method in the instance using the `checkId` parameter as name. This new method is the same as calling `.check(checkId)`. See the example...

```javascript
var r = ss.ready('authDone');
r.addCheck('facebookDone');

r.addCheck('twitterDone')
    // let's try chaining...
    .addCheck('localDone');

/* Do you stuff, add listeners, etc */

// facebook finished
r.check('facebookDone');

// twitter finished, use the newly created method to declare it's done
r.twitterDone();
// do the same with local auth
r.localDone();

```

### .check(checkId)

`.check(checkId)` declares that a *check* has finished.

`check` returns the self instance so you can chain it.

`check` can trigger execution of listeners if it's the last one of the *checks* to finish or if we have attached a [checkListener](#addchecklistenercheckid-fn) for this check.

### .addListener(fn)

Adds a listener for the completion of the current *ready watch*. `fn` has to be a function.

`addListener` returns a unique identifier (string) that we can use to [remove the listener](#removelisteneruid-removechecklisteneruid).

```javascript
var r = ss.ready('appReady');
r.addCheck('DOM');
r.addCheck('auth');
r.addCheck('serverDataObjects');

/* ... */

// When our app is ready execute allDone to cleanup and update UI
ss.ready('appReady').addListener(allDone);

/* ... */

// load widgets when our app is ready
var r = ss.ready('appReady');

// load twitter widget after app is ready
r.addListener(lazyLoadTwitter);

// load calendar widget after app is ready
r.addListener(lazyLoadCalendar);
```

### .addCheckListener(checkId, fn)

Adds a listener for the completion of the specified *check*.

`addCheckListener` behaves like [`addListener`](#addlistenerfn), returns a unique string identifier which can be used to [remove the check listener](#removelisteneruid-removechecklisteneruid)

### .removeListener(uid), .removeCheckListener(uid)

Removes a listener from the *ready watch* or the specific *check*.

`removeListener` and `removeCheckListener` return the current instance, so they are chainable.

```javascript
// create and construct our ready watch
var r = ss.ready('loadComplete')
    .addCheck('googleLoaded')
    .addCheck('twitterLoaded')
    .addCheck('facebookLoaded');

// add a ready listener and a check listener
var readyUid = r.addListener(onLoadComplete);
var checkUid = r.addCheckListener('twitterLoaded', onTwitterLoad);

/* ... */

// we want to remove the two listeners we added as they no longer are needed
var r = ss.ready('loadComplete');
// remove the main watch listener
r.removeListener(readyUid)
    // and remove the check listener
    .removeCheckListener(checkUid);
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

function appReady() {
    /* do stuff */
}

// we'll use the main event to attach the appReady callback
ss.ready(appReady);

// load a few libs when app is ready
ss.ready(lazyLoadTwitter);
ss.ready(lazyLoadCalWidget);

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
    /* do your stuff */

    // Check facebook watch
    ss.ready().facebookAuth();
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

r.addListener(function(){
    /* will execute synchronously as the ready watch has finished */
});
```

### Example 3: Ready watch inside a repeative callback
```javascript

// listen for click on User Search
$('#button-search-users').on('click', function(e){

    /* ... cook criteria, etc ... */

    // disable our button
    $(this).attr('disabled', 'disabled');

    loadUsers(criteria, usersLoaded);
});

/**
 * When users finish loading and UI is populated
 * call this function
 * @return {void}
 */
function usersLoadFinished() {
    $('#button-search-users').removeAttr('disabled');
}

/**
 * Callback function for 'loadUsers' function
 *
 * @param  {Array.<Object>} allUsers An array containing user data objects
 * @return {void}
 */
function usersLoaded(allUsers) {
    // prepare our ready watch, force init as this is a repeative
    // call and we don't want to load previous state
    var r = ss.ready('usersLoaded', true);

    // add checks for all our operations
    r.addCheck('allParsed')
    r.addCheck('uiReady');

    // when all done execute usersLoadFinished
    r.addListener(usersLoadFinished);

    // go through all users
    var user, userBlock;
    for (var i = 0, l = allUsers.length ; i < l ; i++) {
        // get the single user data object
        user = allUsers[i];
        // get the user markup block, it's an awesome class
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

    // loop finished
    r.check('allParsed');

    // now show the complete list with an animation fx and we are done
    $('#users-search-list').fadeIn('slow', r.uiReady);
}

```

## License
Copyright (c) 2012 Thanasis Polychronakis
Licensed under the [APACHE2 license](http://www.apache.org/licenses/LICENSE-2.0).
