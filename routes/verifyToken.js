const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const [bear, token] = authHeader.split(" ");

    jwt.verify(token, process.env.SEC_PASS, (err, user) => {
      if (err) {
        res.status(403).json("Not a valid token");
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    return res.status(401).json("You are not authenticated");
  }
};

const verifyTokenAndAuthorize = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.userId) {
      next();
    } else {
      res.status(403).json("You are not the user");
    }
  });
};

module.exports = { verifyTokenAndAuthorize };
