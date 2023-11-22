import express from "express";
import type { Request } from "express";
import { downloadPlaylist } from "./processPlaylist.js";
import asyncHandler from "express-async-handler";
import { isValidURL } from "./downloadFile.js";

const port = 4000;
const app = express();

app.get(
  "/",
  asyncHandler(async (req, res) => {
    res.send("Hello world");
  }),
);

app.get(
  "/download",
  asyncHandler(async (req: Request<{ playlistURL: string }>, res) => {
    const url = req.query.playlistURL;
    if (typeof url !== "string" || !isValidURL(url)) {
      throw new Error(`Incorrect playlist URL: ${url}`);
    }
    const playlistURL = new URL(url);
    const playlistPath = await downloadPlaylist(playlistURL);

    res.send(`Downloaded playlist into: ${playlistPath}`);
  }),
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
