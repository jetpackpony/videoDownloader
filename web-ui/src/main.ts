import { postJob } from "./api";
import { createProgressContainer, watchProgress } from "./createProgress";
import "./style.css";

export interface DownloadFormData {
  playlistURL: string;
  title: string;
}

function getFormData(form: HTMLFormElement): DownloadFormData {
  const formData = new FormData(form);
  const playlistURL = formData.get("playlistURL");
  const title = formData.get("title");
  if (!playlistURL || !title) {
    throw new Error(`Couldn't parse form: ${playlistURL}, ${title}`);
  }

  return {
    playlistURL: playlistURL.toString(),
    title: title.toString(),
  };
}

const downloadForm = document.querySelector<HTMLFormElement>("#download-form")!;
downloadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = getFormData(downloadForm);
  const postJobResponse = await postJob(formData);
  downloadForm.reset();

  const container = createProgressContainer(
    postJobResponse.data.jobID,
    formData.title,
  );
  watchProgress(
    postJobResponse.links.progress,
    postJobResponse.links.save,
    container,
  );
});
