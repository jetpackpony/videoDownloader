import fs from "node:fs";
import readline from "node:readline";

export async function* readFile(fileName: string) {
  const file = readline.createInterface({
    input: fs.createReadStream(fileName),
    crlfDelay: Infinity,
  });

  for await (const line of file) {
    yield line;
  }
}
