import { downloadPlaylistEventEmitter } from "./downloadEventEmitter.js";

export function downloadPlaylist(url: URL, title: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const emitter = downloadPlaylistEventEmitter(url, title);

    emitter.on("error", reject);
    emitter.on("progress", ({ percent, eta }) => {
      console.log(`${percent}% ETA ${eta}`);
    });
    emitter.on("complete", () => {
      resolve(emitter.destination);
    });
  });
}
