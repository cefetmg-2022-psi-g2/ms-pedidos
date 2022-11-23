const axios = require("axios").default;

module.exports = (req, res, next) => {
    axios.post(process.env.MS_AUTH_URL+"/validate", { "token": `${ req.body.token || req.query.token || req.headers["x-access-token"]}` }).then((result) => {
        if (result.data.valid) {
            req.body.user = result.data.data;
            req.body.user.id += "";
            next();
        } else {
            console.log(result);
            res.status(401).send("Unauthorized");
        }
    }).catch((err) => {	
        if(err.code == 'ECONNREFUSED'){
            res.status(502).send("Bad Gateway");
        }else if (err.response.status == 400 || err.response.status == 401) {
            res.status(401).send("Unauthorized or Invalid Token");
        }else{
            console.log(err);
            res.status(500).send("Internal Server Error");
        }
    });

}
