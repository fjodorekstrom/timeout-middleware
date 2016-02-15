#timeout-middleware#
Express middleware that intercepts the `res.status`, `res.sendStauts` and `res.send` functions and checks for whether the response has timed out or not.

##Why
The res object in Express is a subclass of Node.js's `http.ServerResponse`.
It is possible to call `res.setHeader(name, value)` as often as needed until `res.writeHead(statusCode)` is called.
After `writeHead`, the headers are baked in and you can only call `res.write(data)`, and finally `res.end(data)`.

Because of the way middleware processing works, once a module passes the request to the next middleware, it can no longer stop the flow, so we need to check if the request has timed out before we can continue to act on the request.

The express module for timeout `connect-timeout` does this with a middleware that checks for `res.timedout`. 
Which would be used (as top-level middleware) like this:
```
var express = require('express');
var timeout = require('connect-timeout');

// example of using this top-level; note the use of haltOnTimedout
// after every middleware; it will stop the request flow on a timeout
var app = express();
app.use(timeout('5s'));
app.use(bodyParser());
app.use(haltOnTimedout);
app.use(cookieParser());
app.use(haltOnTimedout);

// Add your routes here, etc.

function haltOnTimedout(req, res, next){
  if (!req.timedout) next();
}

app.listen(3000);
```
Above codesnippet is copied from: https://github.com/expressjs/timeout  

To avoid this, we intercept the usage of `res.status`, `res.sendStatus` and `res.send` with a wrapper that checks for the `res.timedout` bool that we put on the `res` object.  
If `res.timedout` is `true` we return `res`.  
Else we simply return the res function that was called with its arguments:  
```
function wrap(res, fn) {
  return function(...args) {
    if (res.timedout) {
      console.log({res: args, fn: fn.name});
      return res;
    } else {
      return fn.apply(res, args);
    }
  };
}

```
This will then be used in the actual middleware function:  
```
export default (timeoutValue) => {
    return (req, res, next) => {
      const {send, sendStatus, status} = res;
      res.setTimeout(timeoutValue);
      res.on('timeout', () => {
        res.timedout = true;
        if (!res.headersSent) {
          console.log({req, message: 'Request Timeout'});
          res.statusCode = 503;
          res.type('txt');
          send.apply(res, ['Request Timeout']);
        }
      });
      res.send = wrap(res, send);
      res.sendStatus = wrap(res, sendStatus);
      res.status = wrap(res, status);
      next();
    };
};
```

First we destructure the `send`, `sendStatus` and `status` functions from `res`.
Then we set a timeout on the res object (see https://nodejs.org/api/http.html#http_class_http_serverresponse).

On timeout we set a `boolean` attribute called `res.timedout` to true.
Then we check for the `res.headersSent` and if it return `false` we set the `res.statusCode` to 503, `res.type` to `'txt'` and applies the `[Request Timeout]` to `send`.

Outside of the `timeout` listener we let the `res.send` use the wrapper function to intercept any timeouts for that function. We do the same with `res.sendStatus` and `res.status`.

Finally we proceed with `next()`.

Now we can use it as a top-level middleware like this:
```
import express from 'express';
import timeout from 'timeout-middleware';
const app = express();

app.use(timeout(30000)); //timeout in milliseconds
app.use(bodyParser());
app.use(cookieParser());

app.listen(3000);
```
