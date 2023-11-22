import express from "express";
import asyncHandler from "express-async-handler";

const port = 4000;
const app = express();

app.get(
  "/",
  asyncHandler(async (req, res) => {
    res.send("Hello world");
  }),
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
