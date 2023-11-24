export function watchProgress(url, container) {
  console.log("watching progress for ", url, container);

  const source = new EventSource(url);

  let maxPercent = 0;
  source.addEventListener("progress", ({ data }) => {
    const { percent, eta } = JSON.parse(data);
    maxPercent = Math.max(maxPercent, percent);
    if (maxPercent > 100) {
      maxPercent = 100;
    }
    console.log(`Progress ${maxPercent}%, ETA: ${eta}`);
    const progressBar = container.querySelector(".progress");
    progressBar.innerText = `${maxPercent}%`;
    progressBar.value = maxPercent;
    const etaValue = container.querySelector(".eta-value");
    etaValue.innerText = eta;
  });

  source.addEventListener("complete", () => {
    console.log(`Complete`);
    source.close();
  });

  source.onerror = (err) => {
    console.error(`Error`, err);
    source.close();
  };
}
