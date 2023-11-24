import YTDlp from "yt-dlp-wrap";
import { EventEmitter } from "node:events";

const TMP_DIRECTORY = "tmp";
const CONCURRENT_DOWNLOADS = 8;

const DEST_MASK = /Destination: (.+)/;
const ALREADY_DOWNLOADED_MASK = /(.+) has already been downloaded/;
const PROGRESS_MASK = /(\S+)%.*ETA (\S+)/;

export class DownloadEventEmitter extends EventEmitter {
  public destination: string = "";
}

export function downloadPlaylistEventEmitter(url: URL, title: string) {
  const emitter = new DownloadEventEmitter();

  new YTDlp.default()
    .exec([
      url.toString(),
      "-P",
      TMP_DIRECTORY,
      "-o",
      `${title}.%(ext)s`,
      "-N",
      CONCURRENT_DOWNLOADS.toString(),
    ])
    .on("ytDlpEvent", (eventType, eventData) => {
      if (eventType === "download") {
        if (!emitter.destination) {
          const destEvent = eventData.match(DEST_MASK);
          if (destEvent !== null) {
            emitter.destination = destEvent[1].trim();
          }
          const downloadedAlready = eventData.match(ALREADY_DOWNLOADED_MASK);
          if (downloadedAlready) {
            emitter.destination = downloadedAlready[1].trim();
          }
        }
        const progress = eventData.match(PROGRESS_MASK);
        if (progress !== null) {
          const percent = parseInt(progress[1], 10);
          const eta = progress[2];
          emitter.emit("progress", { percent, eta });
        }
      }
    })
    .on("error", (error) => {
      emitter.emit("error", error);
    })
    .on("close", () => {
      emitter.emit("complete");
    });

  return emitter;
}
