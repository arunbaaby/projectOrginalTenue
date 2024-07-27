const jwt = require('jsonwebtoken');
const config = process.env; 

const verifyToken = async(req,res,next)=>{

    //token can arrive in many ways(passed by front end developer)
    const token = req.body.token || req.query.token || req.headers['authorization'];
    //if token does't arrive
    //403(Forbidden) = server understood the request but refuses to authorize it
    if(!token){
        return res.status(403).json({
            success:false,
            msg:'A token is required for authentication'
        })
    }
    try {

        const bearer = token.split(' ');
        const bearerToken = bearer[1];
        
        //const config = process.env;
        const decodedData = jwt.verify(bearerToken,config.ACCESS_TOKEN_SECRET);
        req.user = decodedData;
        
    } catch (error) {
        return res.status(403).json({
            success:false,
            msg:'Invalid token'
        })
    }
    return next();
}

module.exports={
    verifyToken
}