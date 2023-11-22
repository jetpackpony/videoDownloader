import path from "path";
import { downloadFile } from "./downloadFile.js";
import { readFile } from "./readFile.js";

const initPattern = /#EXT-X-MAP:URI="(.+)"/;
const segmentPattern = /(^[^#].*)/;
const TMP_DIRECTORY = "tmp";

export async function downloadPlaylist(playlistURL: URL) {
  const playlistPath = path.join(TMP_DIRECTORY, "playlist.m3u8");
  await downloadFile(playlistURL, playlistPath);
  const segments = [];
  for await (const line of readFile(playlistPath)) {
    const filenames = line.match(initPattern) || line.match(segmentPattern);
    if (filenames) {
      const segmentURL = new URL(playlistURL.toString());
      const segmentPath = segmentURL.pathname.split("/");
      segmentPath[segmentPath.length - 1] = filenames[1];
      segmentURL.pathname = segmentPath.join("/");
      const filepath = path.join(TMP_DIRECTORY, filenames[1]);

      segments.push(downloadFile(segmentURL, filepath));
    }
  }
  await Promise.all(segments);
  return playlistPath;
}
