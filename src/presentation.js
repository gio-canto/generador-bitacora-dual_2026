document.documentElement.classList.add("js");

const reveals = [...document.querySelectorAll(".reveal")];

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.08,
    },
  );
  reveals.forEach((node) => observer.observe(node));
} else {
  reveals.forEach((node) => node.classList.add("is-visible"));
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("../sw.js", { updateViaCache: "none" })
    .catch(() => {
      // La landing sigue funcionando sin service worker.
    });
}
