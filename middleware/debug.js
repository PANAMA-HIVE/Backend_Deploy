//Debugging middleware to log incoming requests and their details

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};


//This middleware can be used in routes to log request details for debugging purposes. It logs the HTTP method, URL, headers, and body of incoming requests.
export const debugMiddleware = (req, res, next) => {
    console.log(colors.green, `--- Debug Middleware --- [${new Date().toISOString()}]`, colors.reset);
    console.log(colors.blue, `Method: ${req.method}`, colors.reset);
    console.log(colors.yellow, `URL: ${req.originalUrl}`, colors.reset);
    console.log(colors.green, '------------------------', colors.reset);

    //Process next middleware or route handler
    next();
}