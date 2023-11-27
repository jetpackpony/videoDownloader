function setProgress(container, value) {
  const progressBar = container.querySelector(".progress");
  progressBar.innerText = `${value}%`;
  progressBar.value = value;
}

function setETA(container, value) {
  const etaValue = container.querySelector(".eta-value");
  etaValue.innerText = value;
}

export function watchProgress(progressURL, saveURL, container) {
  console.log("watching progress for ", progressURL);

  const source = new EventSource(progressURL);

  let maxPercent = 0;
  source.addEventListener("progress", ({ data }) => {
    const { percent, eta } = JSON.parse(data);
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
    saveLink.href = saveURL;
    saveLink.title = "Save Downloaded Video";
    saveLink.innerText = "Save video";
    container.appendChild(saveLink);
    setProgress(container, 100);
    setETA(container, "--:--");
  });

  source.onerror = (err) => {
    console.error(`Error`, err);
    source.close();
  };
}
