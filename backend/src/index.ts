import express from "express";
import type { Request } from "express";
import asyncHandler from "express-async-handler";
import { isValidURL } from "./downloadFile.js";
import { downloadPlaylist } from "./ytDlp.js";
import fs from "node:fs/promises";

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
  asyncHandler(
    async (req: Request<{ playlistURL: string; title: string }>, res, next) => {
      const url = req.query.playlistURL;
      const title = (req.query.title || "output").toString();
      if (typeof url !== "string" || !isValidURL(url)) {
        throw new Error(`Incorrect playlist URL: ${url}`);
      }
      const playlistURL = new URL(url);
      const playlistPath = await downloadPlaylist(playlistURL, title);

      if (playlistPath) {
        console.log(`downloaded into ${playlistPath}`);
        res.download(playlistPath, (err) => {
          if (err) {
            next(err);
          } else {
            console.log("Sent:", playlistPath);
            fs.unlink(playlistPath).then(() => {
              console.log("Removed the tmp file");
            });
          }
        });
      } else {
        res.send(`Failed to download playlist`);
      }
    },
  ),
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
