import { DownloadEventEmitter } from "./downloadEventEmitter.js";

export interface Job {
  id: string;
  eventEmitter: DownloadEventEmitter;
}

export interface PostJobResponse {
  data: { jobID: Job["id"] };
  links: {
    progress: string;
    save: string;
  };
}
export function isPostJobResponse(
  content: unknown,
): content is PostJobResponse {
  // TODO: implement actual validation
  return true;
}

export interface ProgressEventData {
  percent: number;
  eta: string;
}
export function isProgressEventData(data: unknown): data is ProgressEventData {
  // TODO: implement actual validation
  return true;
}

export interface CompleteEventData {}
