const mongoose = require("mongoose");

const comicSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comics: [
      {
        title: { type: String, required: true },
        subtitle: { type: String, required: true },
        series: { type: String, required: true },
        author: { type: String, required: true },
        page: { type: Number, required: true },
        img: { type: String, required: true },
        genre: { type: String },
        own: { type: Boolean, default: false },
        progress: { type: Number, default: 0 },
        status: { type: String, default: "Pending" },
        current: { type: Boolean, default: false },
        start: { type: String },
        end: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Comic", comicSchema);
