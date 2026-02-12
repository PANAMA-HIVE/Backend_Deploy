import { getAuth } from "@clerk/express";

export const verifyAuth = (req, res, next) => {
    // Extract the authentication information from the request using Clerk's getAuth function ()

    const auth = getAuth(req)

    try{
    // Handle if the user is not authorized
    if (!auth || !auth.userId) {
        return res.status(403).send('Forbidden: User not authenticated');
    }

    req.userId = auth.userId; // Attach the user ID to the request object for use in subsequent middleware or route handlers
    //User is authenticated, proceed to the next middleware or route handler
    next()

    }catch(err){
        console.error("Error in verifyAuth middleware:", err);
        return res.status(500).send('Unauthorized: Failed Authentication');
    }
};