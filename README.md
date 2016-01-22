#timeout-middleware#
Express middleware that intercepts the response and checks for whether the response has timed out or not.

##How to use##

Express:
```
import timeout from 'timeout-middleware';
const app = express();

app.use(timeout(30000)); //timeout in milliseconds
```

##Wrapper function##

This function takes the response object and a function as arguments and returns either the response object as is, or `fn.apply(res, args)`
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

Where `fn` is one of the res functions `send`, `status` or `sendStatus`.

##Middleware##

Sets a timeout on the res object (see https://nodejs.org/api/http.html#http_class_http_serverresponse).

On timeout it responds with 408.
```
const {send, sendStatus, status} = res;
  res.setTimeout(timeoutValue);
  res.on('timeout', () => {
    res.timedout = true;
    if (!res.headersSent) {
      console.log({req, message: 'Request Timeout'});
      res.statusCode = 408;
      res.type('txt');
      send.apply(res, ['Request Timeout']);
    }
  });
  res.send = wrap(res, send);
  res.sendStatus = wrap(res, sendStatus);
  res.status = wrap(res, status);
  next();
};
```