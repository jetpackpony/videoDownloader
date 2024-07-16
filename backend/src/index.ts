import express from "express";
import cors from "cors";
import type { Request } from "express";
import bodyParser from "body-parser";
import asyncHandler from "express-async-handler";
import { isValidURL } from "./downloadFile.js";
import { downloadPlaylist } from "./ytDlp.js";
import fs from "node:fs/promises";
import { nanoid } from "nanoid";
import { downloadPlaylistEventEmitter } from "./downloadEventEmitter.js";
import type { Job, PostJobResponse, ProgressEventData } from "./types.js";
import { log } from "./log.js";

const port = process.env.PORT || 4000;
const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(cors());
}
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
        log(`downloaded into ${playlistPath}`);
        res.download(playlistPath, (err) => {
          if (err) {
            next(err);
          } else {
            log(`Sent: ${playlistPath}`);
            fs.unlink(playlistPath).then(() => {
              log("Removed the tmp file");
            });
          }
        });
      } else {
        res.send(`Failed to download playlist`);
      }
    },
  ),
);

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

      log(`Got URL: ${playlistURL} and title: ${title}`);
      const job: Job = {
        id: nanoid(8),
        eventEmitter: downloadPlaylistEventEmitter(playlistURL, title),
      };
      jobs.push(job);

      const response: PostJobResponse = {
        data: { jobID: job.id },
        links: {
          progress: `/progress?jobID=${job.id}`,
          save: `/save?jobID=${job.id}`,
        },
      };

      res.json(response);
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

      job.eventEmitter.on("progress", (progress: ProgressEventData) => {
        res.write(`event: progress\n`);
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      });
      job.eventEmitter.on("complete", () => {
        log(
          `Finished job ${job.id}, downloaded into: ${job.eventEmitter.destination}`,
        );
        res.write(`event: complete\n`);
        res.write(`data: {}\n\n`);
        res.end();
      });
      job.eventEmitter.on("error", (err) => {
        next(err);
      });
    },
  ),
);

app.get(
  "/save",
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

      const dest = job.eventEmitter.destination;
      res.download(dest, (err) => {
        if (err) {
          next(err);
        } else {
          log(`Sent: ${dest}`);
          fs.unlink(dest).then(() => {
            log("Removed the tmp file");
            jobs = jobs.filter((j) => j.id !== job.id);
          });
        }
      });
    },
  ),
);

app.listen(port, () => {
  log(`Server running on port ${port}`);
});
