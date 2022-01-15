const router = require("express").Router();
const Book = require("../models/Book");
const { ObjectId } = require("mongodb");
const { verifyTokenAndAuthorize } = require("./verifyToken");

// CREATE
router.post("/:userId", verifyTokenAndAuthorize, async (req, res) => {
  try {
    const check = await Book.findOne({ userId: ObjectId(req.params.userId) });

    if (!check) {
      const book = new Book({ userId: ObjectId(req.params.userId) });
      await book.save();
      await book.updateOne({ $push: { books: req.body } }, { new: true });

      res.status(201).json(book);
    } else {
      const exists = await Book.find({
        userId: ObjectId(req.params.userId),
        "books.title": req.body.title,
      });

      if (exists.length > 0) {
        res.status(400).json("Book already exists");
      } else {
        await check.updateOne({ $push: { books: req.body } }, { new: true });
      }

      res.status(201).json("Book added");
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
      findParams[`books.${key}`] = req.query[key].toLowerCase() === "true";
    } else if (key === "sortBy") {
      if (req.query[key] === "author") {
        sortParams["books.author"] = 1;
      } else if (req.query[key] === "series") {
        sortParams["books.subtitle"] = 1;
      } else if (req.query[key] === "asc") {
        sortParams["books.title"] = 1;
      } else if (req.query[key] === "desc") {
        sortParams["books.title"] = -1;
      } else if (req.query[key] === "latest") {
        sortParams["books._id"] = -1;
      } else if (req.query[key] === "end") {
        sortParams["books.end"] = 1;
      } else {
      }
    } else {
      findParams[`books.${key}`] = req.query[key];
    }
  });

  try {
    const books = await Book.aggregate([
      { $unwind: "$books" },
      { $match: findParams },
      { $sort: sortParams },
      {
        $group: {
          _id: { _id: "$_id", userId: "$userId" },
          books: { $push: "$books" },
        },
      },
    ]);
    res.status(200).json(books);
  } catch (e) {
    res.status(500).json(e);
  }
});

// GET
router.get("/:userId/:bookId", verifyTokenAndAuthorize, async (req, res) => {
  let findParams = {
    "books._id": ObjectId(req.params.bookId),
    userId: ObjectId(req.params.userId),
  };

  try {
    const book = await Book.aggregate([
      { $unwind: "$books" },
      { $match: findParams },
    ]);
    res.status(200).json(book);
  } catch (e) {
    res.status(500).json(e);
  }
});

// UPDATE
router.put("/:userId/:bookId", verifyTokenAndAuthorize, async (req, res) => {
  let findParams = {
    "books._id": ObjectId(req.params.bookId),
    userId: ObjectId(req.params.userId),
  };

  let setParams = { "books.$._id": ObjectId(req.params.bookId) };

  Object.keys(req.body).forEach((key) => {
    setParams[`books.$.${key}`] = req.body[key];
  });

  try {
    await Book.findOneAndUpdate(findParams, { $set: setParams });
    res.status(200).json("Updated successfully");
  } catch (e) {
    res.status(500).json(e);
  }
});

// DELETE
router.delete("/:userId/:bookId", verifyTokenAndAuthorize, async (req, res) => {
  try {
    const book = await Book.update(
      {
        userId: req.params.userId,
        "books._id": req.params.bookId,
      },
      {
        $pull: { books: { _id: req.params.bookId } },
      },
      { multi: true }
    );

    res.status(200).json(book);
  } catch (e) {
    res.status(500).json(e);
  }
});

module.exports = router;
