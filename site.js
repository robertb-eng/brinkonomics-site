/* Brinkonomics public site: progress bar, reveal-on-swipe, keyboard, quiz and share. No tracking. */
(() => {
  document.documentElement.classList.add("js");
  const feed = document.querySelector(".feed");
  const slides = [...document.querySelectorAll(".slide")];
  const prog = document.querySelector(".prog");

  const toast = text => {
    const t = Object.assign(document.createElement("div"), {className: "toast", textContent: text});
    document.body.append(t);
    setTimeout(() => t.remove(), 2200);
  };

  // Story-style progress segments, and each screen's content rises in as it arrives.
  if (feed && prog) {
    prog.innerHTML = slides.map(() => "<i></i>").join("");
    const bars = [...prog.children];
    const seen = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const n = slides.indexOf(en.target);
      en.target.classList.add("seen");
      bars.forEach((b, k) => { b.className = k < n ? "done" : k === n ? "on" : ""; });
    }), {threshold: 0.55});
    slides.forEach(s => seen.observe(s));
    document.addEventListener("keydown", ev => {
      if (ev.target.closest("input,textarea,select,button,summary,a,audio,video")) return;   // keep Space and arrows for the control in focus
      const now = slides.findIndex(s => Math.abs(s.getBoundingClientRect().top) < innerHeight / 2);
      const go = {ArrowDown: 1, j: 1, PageDown: 1, " ": 1, ArrowUp: -1, k: -1, PageUp: -1}[ev.key];
      if (!go || now < 0) return;
      ev.preventDefault();
      slides[Math.max(0, Math.min(slides.length - 1, now + go))].scrollIntoView({behavior: "smooth"});
    });
    // Only one video or audio plays at a time, and a video pauses when you swipe past it.
    document.addEventListener("play", ev => document.querySelectorAll("video,audio").forEach(m => m !== ev.target && m.pause()), true);
    const away = new IntersectionObserver(entries => entries.forEach(en => { if (!en.isIntersecting) en.target.pause(); }), {threshold: 0.2});
    document.querySelectorAll("video").forEach(v => away.observe(v));
  } else slides.forEach(s => s.classList.add("seen"));

  // Quiz: tap an answer, see if you were right and why; the end screen keeps score.
  let right = 0, done = 0;
  const quizzes = document.querySelectorAll(".quiz");
  const burst = (el, color) => {
    const box = el.getBoundingClientRect(), host = el.closest(".slide"), hb = host.getBoundingClientRect();
    for (let i = 0; i < 18; i++) {
      const p = Object.assign(document.createElement("i"), {className: "burst"});
      p.style.cssText = `left:${box.left - hb.left + box.width / 2}px;top:${box.top - hb.top + box.height / 2}px;background:${i % 2 ? color : "#FFB000"};` +
        `--x:${(Math.random() - .5) * 260}px;--y:${(Math.random() - .8) * 220}px`;
      host.append(p);
      setTimeout(() => p.remove(), 1000);
    }
  };
  quizzes.forEach(q => q.addEventListener("click", ev => {
    const a = ev.target.closest("[data-a]");
    if (!a || q.classList.contains("done")) return;
    const answer = +q.dataset.answer, ok = +a.dataset.a === answer;
    q.classList.add("done");
    q.querySelectorAll("[data-a]").forEach(b => b.classList.toggle("right", +b.dataset.a === answer));
    if (!ok) a.classList.add("wrong");
    else burst(a, "#3ccf7e");
    q.querySelector(".why").hidden = false;
    if (navigator.vibrate) navigator.vibrate(ok ? 18 : [30, 40, 30]);
    right += ok; done++;
    if (done === quizzes.length) {
      const s = document.querySelector(".score");
      if (s) { s.textContent = right === done ? `Perfect score: ${right} of ${done}.` : `You got ${right} of ${done}.`; s.hidden = false; }
    }
  }));

  // Share: the phone's share sheet where there is one, otherwise copy the link.
  document.addEventListener("click", async ev => {
    const b = ev.target.closest("[data-share]");
    if (!b) return;
    const url = (document.querySelector("link[rel=canonical]")?.href || location.href.split("#")[0]) + (b.dataset.share || "");
    const title = document.title;
    try {
      if (navigator.share) return await navigator.share({title, url});
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch (err) {
      if (err && err.name !== "AbortError") toast("Couldn't share that link");
    }
  });
})();
