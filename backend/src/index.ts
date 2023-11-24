import express from "express";
import type { Request } from "express";
import bodyParser from "body-parser";
import asyncHandler from "express-async-handler";
import { isValidURL } from "./downloadFile.js";
import { downloadPlaylist } from "./ytDlp.js";
import fs from "node:fs/promises";
import { nanoid } from "nanoid";
import {
  DownloadEventEmitter,
  downloadPlaylistEventEmitter,
} from "./downloadEventEmitter.js";

const port = 4000;
const app = express();

app.use(express.static("public"));
app.use(bodyParser.json());

app.get(
  "/download",
  asyncHandler(
    async (
      req: Request<
        unknown,
        unknown,
        unknown,
        { playlistURL: string; title: string }
      >,
      res,
      next,
    ) => {
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

interface Job {
  id: string;
  eventEmitter: DownloadEventEmitter;
}
let jobs: Job[] = [];

app.post(
  "/job",
  asyncHandler(
    async (
      req: Request<unknown, unknown, { playlistURL: string; title: string }>,
      res,
    ) => {
      const url = req.body.playlistURL;
      const title = (req.body.title || "output").toString();
      if (typeof url !== "string" || !isValidURL(url)) {
        throw new Error(`Incorrect playlist URL: ${url}`);
      }
      const playlistURL = new URL(url);

      console.log(`Got URL: ${playlistURL} and title: ${title}`);
      const job = {
        id: nanoid(8),
        eventEmitter: downloadPlaylistEventEmitter(playlistURL, title),
      };
      jobs.push(job);

      res.json({
        data: { jobID: job.id },
        links: { progress: `/progress?jobID=${job.id}` },
      });
    },
  ),
);

app.get(
  "/progress",
  asyncHandler(
    async (
      req: Request<unknown, unknown, unknown, { jobID: string }>,
      res,
      next,
    ) => {
      const jobID = req.query.jobID;
      const job = jobs.find((job) => job.id === jobID);
      if (!job) {
        throw new Error(`Couldn't find a job with ID ${jobID}`);
      }

      const headers = {
        "Content-Type": "text/event-stream",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
      };
      res.writeHead(200, headers);

      job.eventEmitter.on("progress", (progress) => {
        res.write(`event: progress\n`);
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      });
      job.eventEmitter.on("complete", (progress) => {
        console.log(
          `Finished job ${job.id}, downloaded into: ${job.eventEmitter.destination}`,
        );
        jobs = jobs.filter((j) => j.id !== job.id);
        res.write(`event: complete\n`);
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
        res.end();
      });
      job.eventEmitter.on("error", (err) => {
        next(err);
      });
    },
  ),
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
