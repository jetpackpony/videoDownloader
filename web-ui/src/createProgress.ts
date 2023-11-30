import { isProgressEventData } from "../../backend/src/types";
import { makeAPIURL } from "./api";

const progressTemplate =
  document.querySelector<HTMLTemplateElement>("#progress-template")!;

function cloneNode<T extends Node>(node: T, deep?: boolean | undefined) {
  return <T>node.cloneNode(deep);
}

export function createProgressContainer(jobID: string, title: string) {
  console.log(`Created job with ID: ${jobID}`);
  const containerID = `job-${jobID}`;
  const clone = cloneNode(progressTemplate.content, true);
  clone.querySelector<HTMLDivElement>("div")!.id = containerID;
  clone.querySelector<HTMLDivElement>(".title")!.innerText = title;

  document.querySelector("#progress-container")!.appendChild(clone);

  return document.querySelector<HTMLDivElement>(`#${containerID}`)!;
}

function setProgress(container: HTMLElement, value: number) {
  const progressBar =
    container.querySelector<HTMLProgressElement>(".progress")!;
  progressBar.innerText = `${value}%`;
  progressBar.value = value;
}

function setETA(container: HTMLElement, value: string) {
  const etaValue = container.querySelector<HTMLSpanElement>(".eta-value")!;
  etaValue.innerText = value;
}

export async function watchProgress(
  progressURL: string,
  saveURL: string,
  container: HTMLElement,
) {
  console.log("watching progress for ", progressURL);

  const source = new EventSource(makeAPIURL(progressURL));

  let maxPercent = 0;
  source.addEventListener("progress", ({ data }) => {
    const parsedData = JSON.parse(data);
    if (!isProgressEventData(parsedData)) {
      throw new Error(`Unexpected API return: ${parsedData}`);
    }
    const { percent, eta } = parsedData;
    maxPercent = Math.max(maxPercent, percent);
    if (maxPercent > 100) {
      maxPercent = 100;
    }
    setProgress(container, maxPercent);
    setETA(container, eta);
  });

  source.addEventListener("complete", () => {
    console.log(`Complete`, progressURL);
    source.close();
    const saveLink = document.createElement("a");
    saveLink.href = makeAPIURL(saveURL);
    saveLink.title = "Save Downloaded Video";
    saveLink.innerText = "Save video";
    saveLink.target = "_blank";
    container.appendChild(saveLink);
    setProgress(container, 100);
    setETA(container, "--:--");
  });

  source.onerror = (err) => {
    console.error(`Error`, err);
    source.close();
  };
}
