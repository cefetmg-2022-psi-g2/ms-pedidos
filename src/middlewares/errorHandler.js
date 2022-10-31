module.exports = (middleware, req,res,next) => {
    middleware(req, res, (err) => {
        if (err) {
            console.log("Error when parsing body: ", err.message);
            return res.sendStatus(400); // Bad request
        }
        next();
      });
}