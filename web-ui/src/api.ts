import { isPostJobResponse } from "../../backend/src/types.js";
import { DownloadFormData } from "./main.js";

const API_ADDRESS = import.meta.env.VITE_API_ADDRESS || "";

export async function postJob(formData: DownloadFormData) {
  const rawResponse = await fetch(`${API_ADDRESS}/job`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
  const content = await rawResponse.json();
  if (!isPostJobResponse(content)) {
    throw new Error(`Unexpected API return value: ${content}`);
  }
  return content;
}

export function makeAPIURL(relativeURL: string) {
  return `${API_ADDRESS}${relativeURL}`;
}
