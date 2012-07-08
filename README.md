# ready.js

Watches over multiple async operations and triggers listeners when all or some are complete.

At only 815bytes (gzip) ready.js is a powerfull tiny library that alllows you to manage and monitor multiple asynchronous operations, giving you total control on the execution flow of your application.

ready.js runs both on the browser and node.js

## Getting Started

### Browser version

[Get the latest browser version (0.6.0)](https://github.com/thanpolas/ready.js/raw/master/dist/ready.min.js).

### node.js

`npm install asyncready.js` (ready.js was taken).

```javascript

var ss = { ready: require('asyncready.js') };

// lib loaded in the ss.ready namespace, we are ready to go
```

[Check out the source](https://github.com/thanpolas/ready.js/blob/master/lib/ready.js) and the same source [adapted to run on node.js](https://github.com/thanpolas/ready.js/blob/master/dist/ready.node.js).


## The Story

ready.js has **watches** which have **checks** that have to be *checked* in order to complete a *watch*. We can attach listeners on the completion of a single *check* or the completion of the whole *ready watch*.

Let's say we have 4 asynchronous operations that need to run, in any order, and we want to execute xyz methods when all 4 complete.

We will create a ready watch, let's name it `jobDone`.

```javascript
var r = ss.ready('jobDone');
```

As per our scenario, we want to watch the execution of 4 async operations. Let's say they are 2 db writes, 1 db read and 1 file operation. We'll have to create the 4 *checks* to inform the *ready watch* what to expect.

```javascript
// our ready watch was stored in var r
r.addCheck('db_write_one');

// we can get the same ready watch every time we call ss.ready('jobDone')
ss.ready('jobDone')
    .addCheck('db_write_two');

// addCheck methods can be chained
r.addCheck('db_read_one')
    .addCheck('file_op_one');
```

At this point we have setup our *ready watch* and what is expectated to complete before the *watch* is finished. Let's add some listeners on the *watch* that will trigger when everything has finished.

```javascript
// As per our scenario we want to execute xyz methods when
// our ready watch finishes. So, xyz, are actually x(), y()
// and z() which are in our context:
var r = ss.ready('jobDone');
r.addListener(x);
// we can chain addListener too, so this is ok:
ss.ready('jobDone')
   .addListener(y)
   .addListener(z);
```

Awesome, we now have a *ready watch* witch *checks* and listeners attached. Now, somewhere deep in our code, we do the async operations. When they are finished we want to inform our *ready watch* about it so it can check if everything else is also finished and trigger our listeners. Here is how we do it:

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
// So for cases where we don't care about the callback we can
// inline the check call like this:
client.set('two', 'this is db write two', ss.ready('jobDone').db_write_two);

/* Let's finish this up now... */

// two remaining checks todo, remember to call the checks in any outcome
// of your async operations, success or failure!

client.get('this_key_doesnt_exist', function(err, reply){
    /* handle your error but ALWAYS check your watch!
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

### ss.ready(name|function, opt_forceInit)




## License
Copyright (c) 2012 Thanasis Polychronakis
Licensed under the [APACHE2 license](http://www.apache.org/licenses/LICENSE-2.0).
