const router = require("express").Router();
const Comic = require("../models/Comic");
const { ObjectId } = require("mongodb");
const { verifyTokenAndAuthorize } = require("./verifyToken");

// CREATE
router.post("/:userId", verifyTokenAndAuthorize, async (req, res) => {
  try {
    const check = await Comic.findOne({ userId: ObjectId(req.params.userId) });

    if (!check) {
      const comic = new Comic({ userId: ObjectId(req.params.userId) });
      await comic.save();
      await comic.updateOne({ $push: { comics: req.body } }, { new: true });

      res.status(201).json(comic);
    } else {
      const exists = await Comic.find({
        userId: ObjectId(req.params.userId),
        "comics.title": req.body.title,
      });

      if (exists.length > 0) {
        res.status(400).json("Comic already exists");
      } else {
        await check.updateOne({ $push: { comics: req.body } }, { new: true });
      }

      res.status(201).json("Comic added");
    }
  } catch (e) {
    res.status(500).json(e);
  }
});

// GET ALL
router.get("/:userId", verifyTokenAndAuthorize, async (req, res) => {
  let findParams = { userId: ObjectId(req.params.userId) };
  let sortParams = { none: 1 };

  Object.keys(req.query).forEach((key) => {
    if (key === "current" || key === "own") {
      findParams[`comics.${key}`] = req.query[key].toLowerCase() === "true";
    } else if (key === "sortBy") {
      if (req.query[key] === "author") {
        sortParams["comics.author"] = 1;
      } else if (req.query[key] === "series") {
        sortParams["comics.subtitle"] = 1;
      } else if (req.query[key] === "asc") {
        sortParams["comics.title"] = 1;
      } else if (req.query[key] === "desc") {
        sortParams["comics.title"] = -1;
      } else if (req.query[key] === "latest") {
        sortParams["comics._id"] = -1;
      } else if (req.query[key] === "end") {
        sortParams["comics.end"] = 1;
      } else {
      }
    } else {
      findParams[`comics.${key}`] = req.query[key];
    }
  });

  try {
    const comics = await Comic.aggregate([
      { $unwind: "$comics" },
      { $match: findParams },
      { $sort: sortParams },
      {
        $group: {
          _id: { _id: "$_id", userId: "$userId" },
          comics: { $push: "$comics" },
        },
      },
    ]);
    res.status(200).json(comics);
  } catch (e) {
    res.status(500).json(e);
  }
});

// GET
router.get("/:userId/:bookId", verifyTokenAndAuthorize, async (req, res) => {
  let findParams = {
    "comics._id": ObjectId(req.params.bookId),
    userId: ObjectId(req.params.userId),
  };

  try {
    const comic = await Comic.aggregate([
      { $unwind: "$comics" },
      { $match: findParams },
    ]);
    res.status(200).json(comic);
  } catch (e) {
    res.status(500).json(e);
  }
});

// UPDATE
router.put("/:userId/:bookId", verifyTokenAndAuthorize, async (req, res) => {
  let findParams = {
    "comics._id": ObjectId(req.params.bookId),
    userId: ObjectId(req.params.userId),
  };

  let setParams = { "comics._id": ObjectId(req.params.bookId) };

  Object.keys(req.body).forEach((key) => {
    setParams[`comics.$.${key}`] = req.body[key];
  });

  try {
    await Comic.findOneAndUpdate(findParams, { $set: setParams });
    res.status(200).json("Updated successfully");
  } catch (e) {
    res.status(500).json(e);
  }
});

// DELETE
router.delete("/:userId/:bookId", verifyTokenAndAuthorize, async (req, res) => {
  try {
    const comic = await Comic.update(
      {
        userId: req.params.userId,
        "comics._id": req.params.bookId,
      },
      {
        $pull: { comics: { _id: req.params.bookId } },
      },
      { multi: true }
    );

    res.status(200).json(comic);
  } catch (e) {
    res.status(500).json(e);
  }
});

module.exports = router;
