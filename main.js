// Loaded with `defer`, after feather-icons, so `feather` is already defined
// and the DOM is fully parsed by the time this runs.
feather.replace();

// Highlight the nav link for the section currently in view.
//
// This deliberately avoids the obvious IntersectionObserver approach of
// "which section straddles the middle of the viewport". Short sections at
// the end of the page never reach the middle — the page runs out of scroll
// first — so Contact would never light up and Projects would stay
// highlighted. Instead we pick the last section whose top has passed the
// line, and special-case the bottom of the page.
const navLinks = document.querySelectorAll("nav a");
const nav = document.querySelector("nav");
const sections = [...document.querySelectorAll("main .section[id]")];

// Publish the nav's real height so scroll-margin-top matches it exactly.
// Keeps nav links landing with the nav pinned even if the nav wraps to two
// rows on a narrow screen.
//
// Floored, and taken from getBoundingClientRect rather than offsetHeight, so
// a fractional height can never round *up*: scroll-margin-top larger than the
// nav would stop the first section short and leave the header peeking.
function syncNavHeight() {
  const height = Math.floor(nav.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--nav-height", `${height}px`);
}

function updateActiveSection() {
  // A section becomes current once its top scrolls up past a line just below
  // the sticky nav. Measuring against the middle of the viewport instead
  // would give each section an active range set by where the *next* section
  // starts rather than by its own height, so any section shorter than the
  // viewport loses its highlight while still filling the screen.
  //
  // This must stay below the sections' scroll-margin-top (72px), so that a
  // section still counts as current the moment a nav click lands on it.
  const line = nav.offsetHeight + 44;

  // Default: before the first section reaches the line, the first nav item is
  // the sensible one to show as current.
  let activeId = sections[0].id;

  for (const section of sections) {
    if (section.getBoundingClientRect().top <= line) activeId = section.id;
  }

  // A short final section can never reach the line — the page runs out of
  // scroll first — so anchor it to the end of the document instead.
  const atBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2;
  if (atBottom) activeId = sections[sections.length - 1].id;

  navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${activeId}`,
    );
  });
}

let ticking = false;
function requestUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateActiveSection();
    ticking = false;
  });
}

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", () => {
  syncNavHeight();
  requestUpdate();
});
syncNavHeight();
updateActiveSection();

// The web font can reflow the nav after first paint, changing its height.
document.fonts?.ready.then(() => {
  syncNavHeight();
  updateActiveSection();
});

// Play a card's demo clip on hover or keyboard focus, and drop back to the
// poster frame on leave. preload="none" means nothing downloads until the
// visitor actually shows interest in the card.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll(".project-card").forEach((card) => {
  const video = card.querySelector(".project-card__video");
  if (!video) return;

  video.muted = true; // required for play() without a click

  const play = () => {
    if (reduceMotion.matches) return;
    video.play().catch(() => {}); // autoplay refusal is not fatal
  };
  const stop = () => {
    video.pause();
    video.load(); // restores the poster frame
  };

  card.addEventListener("mouseenter", play);
  card.addEventListener("mouseleave", stop);
  // focusin/focusout (not focus/blur) because the focusable element is the
  // link inside the card, and only these two bubble up to it.
  card.addEventListener("focusin", play);
  card.addEventListener("focusout", stop);
});
