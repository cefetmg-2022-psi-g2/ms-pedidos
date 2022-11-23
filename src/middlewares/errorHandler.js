module.exports = (middleware, req,res,next) => {
    middleware(req, res, (err) => {
        if (err) {
            return res.sendStatus(400); // Bad request
        }
        next();
      });
}