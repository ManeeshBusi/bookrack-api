const router = require("express").Router();
const cryptoJS = require("crypto-js");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { verifyTokenAndAuthorize } = require("./verifyToken");

// REGISTER
router.post("/register", async (req, res) => {
  req.body.password = cryptoJS.AES.encrypt(
    req.body.password,
    process.env.SEC_PASS
  ).toString();

  const user = new User(req.body);

  try {
    await user.save();
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json(e);
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    !user && res.status(401).json("Wrong Credentials");

    var decPass = cryptoJS.AES.decrypt(
      user.password,
      process.env.SEC_PASS
    ).toString(cryptoJS.enc.Utf8);

    req.body.password !== decPass && res.status(401).json("Wrong Credentials");

    const token = jwt.sign({ id: user._id }, process.env.SEC_PASS);
    const { password, ...others } = user._doc;
    res.status(200).json({ ...others, token });
  } catch (e) {
    res.status(500).json(e);
  }
});

// UPDATE
router.put("/:userId", verifyTokenAndAuthorize, async (req, res) => {
  let setParams = {};

  Object.keys(req.body).forEach((key) => {
    if (key === "password") {
      setParams[key] = cryptoJS.AES.encrypt(
        req.body[key],
        process.env.SEC_PASS
      ).toString();
    } else {
      setParams[key] = req.body[key];
    }
  });

  try {
    await User.findByIdAndUpdate(
      { _id: ObjectId(req.params.userId) },
      { $set: setParams }
    );

    res.status(200).json("Updated User successfully");
  } catch (e) {
    res.status(500).json(e);
  }
});

// DELETE
router.delete("/:userId", verifyTokenAndAuthorize, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete({
      _id: ObjectId(req.params.userId),
    });
    res.status(200).json(user);
  } catch (e) {
    res.status(500).json(e);
  }
});

module.exports = router;
