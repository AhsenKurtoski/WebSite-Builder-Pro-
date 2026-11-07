/**
 * `site.js` del sito esportato.
 *
 * Scritto a mano, senza dipendenze, ES2020: menu mobile, animazioni all'ingresso,
 * invio del modulo e consenso cookie. Nulla viene caricato prima del consenso.
 */
export const SITE_JS = `/* Atelier — comportamento del sito. Nessuna dipendenza. */
(function () {
  "use strict";

  var doc = document;

  /* ---- Menu mobile ---- */
  doc.querySelectorAll("[data-nav-toggle]").forEach(function (toggle) {
    var nav = toggle.closest("[data-nav]");
    if (!nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-nav-open") === "true";
      nav.setAttribute("data-nav-open", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });

  /* ---- Animazioni all'ingresso ---- */
  var animated = doc.querySelectorAll(".atl-motion");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    animated.forEach(function (node) { node.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    animated.forEach(function (node) { observer.observe(node); });
  }

  /* ---- Consenso cookie: niente script prima della scelta ---- */
  var notice = doc.querySelector("[data-atl-consent]");
  if (notice) {
    var KEY = "atl-consent";
    var stored = null;
    try { stored = window.localStorage.getItem(KEY); } catch (error) { stored = null; }
    if (stored) {
      notice.setAttribute("data-consent", "given");
      notice.hidden = true;
    } else {
      notice.hidden = false;
    }
    function decide(value) {
      try { window.localStorage.setItem(KEY, value); } catch (error) { /* modalità privata */ }
      notice.setAttribute("data-consent", "given");
      notice.hidden = true;
      // Gli script di misurazione si attivano SOLO dopo il consenso esplicito.
      if (value === "all") {
        doc.dispatchEvent(new CustomEvent("atelier:consent", { detail: { measurement: true } }));
      }
    }
    var accept = notice.querySelector("[data-atl-consent-accept]");
    var reject = notice.querySelector("[data-atl-consent-reject]");
    if (accept) accept.addEventListener("click", function () { decide("all"); });
    if (reject) reject.addEventListener("click", function () { decide("necessary"); });
    doc.addEventListener("click", function (event) {
      var target = event.target;
      var trigger = target && target.closest ? target.closest("[data-atl-consent-open], a[href='#preferenze-cookie']") : null;
      if (!trigger) return;
      event.preventDefault();
      try { window.localStorage.removeItem(KEY); } catch (error) { /* modalità privata */ }
      notice.hidden = false;
      notice.removeAttribute("data-consent");
    });
  }

  /* ---- Modulo di contatto ---- */
  doc.querySelectorAll("form[data-atl-form]").forEach(function (form) {
    var status = form.querySelector("[data-atl-form-status]");
    function say(message) { if (status) status.textContent = message; }

    form.addEventListener("submit", function (event) {
      var data = new FormData(form);
      // Antispam: se il campo esca è compilato, il messaggio è di un bot.
      if (String(data.get("website") || "").length > 0) {
        event.preventDefault();
        say("Richiesta ricevuta.");
        return;
      }
      var mode = form.getAttribute("data-atl-form");
      if (mode === "disabled") {
        event.preventDefault();
        say("Il modulo non \u00e8 ancora collegato.");
        return;
      }
      if (mode === "mailto") {
        event.preventDefault();
        var mail = form.getAttribute("data-atl-mail") || "";
        var lines = [];
        data.forEach(function (value, key) {
          if (key === "website" || !String(value).trim()) return;
          lines.push(key + ": " + value);
        });
        var subject = "Richiesta dal sito";
        var href = "mailto:" + mail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\\n"));
        say("Apro il tuo programma di posta…");
        window.location.href = href;
        return;
      }
      // modalità endpoint / netlify: invio normale, con stato leggibile.
      say("Invio in corso…");
    });
  });
})();
`;
