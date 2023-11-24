import YTDlp from "yt-dlp-wrap";

const TMP_DIRECTORY = "tmp";
const CONCURRENT_DOWNLOADS = 8;

export function downloadPlaylist(
  url: URL,
  title: string,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    let destination: string | undefined;
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
          if (destination === undefined) {
            const destEvent = eventData.match(/Destination: (.+)/);
            if (destEvent !== null) {
              destination = destEvent[1].trim();
            }
            const downloadedAlready = eventData.match(
              /(.+) has already been downloaded/,
            );
            if (downloadedAlready) {
              destination = downloadedAlready[1].trim();
            }
          }
        }
        console.log(`Event: ${eventType}`, eventData);
      })
      .on("error", (error) => {
        console.error(error);
        reject(error.message);
      })
      .on("close", () => {
        console.log("all done");
        resolve(destination);
      });
  });
}
