import { downloadPlaylistEventEmitter } from "./downloadEventEmitter.js";
import { log } from "./log.js";

export function downloadPlaylist(url: URL, title: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const emitter = downloadPlaylistEventEmitter(url, title);

    emitter.on("error", reject);
    emitter.on("progress", ({ percent, eta }) => {
      log(`${percent}% ETA ${eta}`);
    });
    emitter.on("complete", () => {
      resolve(emitter.destination);
    });
  });
}
