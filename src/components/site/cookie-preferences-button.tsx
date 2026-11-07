"use client";

export function CookiePreferencesButton() {
  function reopen() {
    try {
      localStorage.removeItem("atelier_cookie_notice_v1");
    } catch {
      /* Storage bloccato: l'evento riapre comunque l'avviso. */
    }
    window.dispatchEvent(new Event("atelier:cookie-open"));
  }

  return (
    <button type="button" className="btn btn-outline" onClick={reopen}>
      Riapri l’avviso cookie
    </button>
  );
}
