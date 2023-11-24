import { EventEmitter } from "node:events";

export class DownloadEventEmitter extends EventEmitter {}

export function downloadPlaylistEventEmitter(url: URL, title: string) {
  const emitter = new DownloadEventEmitter();

  let percent = 0;
  const eta = "00:15";
  const interval = setInterval(() => {
    emitter.emit("progress", { percent, eta });
    percent += 20;
    if (percent > 100) {
      emitter.emit("complete");
      clearInterval(interval);
    }
  }, 1000);

  return emitter;
}
