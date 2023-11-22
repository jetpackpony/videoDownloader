import path from "node:path";
import fs from "node:fs";
import https from "node:https";

export function isValidURL(url: string) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (_) {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

export async function downloadFile(url: string | URL, destination: string) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const file = fs.createWriteStream(destination);

    https
      .get(url, function (response) {
        response.pipe(file);
        file.on("finish", function () {
          file.close(() => {
            console.log(`Downloaded ${destination}`);
            resolve(destination);
          });
        });
      })
      .on("error", function (err) {
        fs.unlink(destination, () => reject(err.message));
      });
  });
}
