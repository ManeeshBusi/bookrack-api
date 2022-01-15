// LIB IMPORT
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

// ROUTE IMPORT
const authRoute = require("./routes/auth");
const bookRoute = require("./routes/book");
const comicRoute = require("./routes/comic");

// CONFIG
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("common"));
dotenv.config();

// DB CONNECT
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB Connection successfull");
  })
  .catch((e) => {
    console.log(e);
  });

// ROUTES SETUP
app.use("/api/auth", authRoute);
app.use("/api/book", bookRoute);
app.use("/api/comic", comicRoute);

// SERVE
app.listen(process.env.PORT, () => {
  console.log("Server is up on port ", process.env.PORT);
});
