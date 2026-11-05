import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSession, providerStatuses } from "@/lib/auth/server";
import { safeNext } from "@/lib/auth/navigation";
import { isLocalSecret } from "@/lib/auth/session";

export const metadata = {
  title: "Accedi",
  robots: { index: false, follow: false },
};

/**
 * Accesso. La sessione è un cookie firmato: nessun database utenti, nessun
 * servizio di autenticazione. Chi non vuole collegare GitHub o Google entra in
 * locale e lavora lo stesso — cambia solo dove restano i progetti.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await getSession();
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);

  // Chi ha già una sessione non deve rivedere questa pagina.
  if (user) redirect(next);

  const providers = providerStatuses(next);
  const read = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);

  return (
    <main className="relative isolate grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="aurora opacity-25" />

      <section className="relative hidden flex-col justify-between gap-10 border-r border-surface-800 p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[0.6rem] border border-accent-500/40 bg-accent-600/15 font-mono text-sm text-accent-400">
            A
          </span>
          <span className="grid leading-none">
            <span className="text-sm font-semibold tracking-tight">Atelier</span>
            <span className="text-[10px] text-ink-600">website builder AI</span>
          </span>
        </Link>

        <div className="grid max-w-md gap-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Il tuo spazio di lavoro, sul tuo computer.
          </h1>
          <p className="text-sm leading-relaxed text-ink-500">
            I progetti e le versioni vivono in questo browser. L&apos;accesso serve a separare i workspace e a
            ritrovarli: non è una gabbia, è un&apos;etichetta.
          </p>
          <ul className="grid gap-2 text-[13px] text-ink-300">
            <li className="flex gap-2">
              <span className="text-accent-400">◆</span> Nessun upload dei tuoi contenuti
            </li>
            <li className="flex gap-2">
              <span className="text-accent-400">◆</span> Chiavi AI configurate sul server, mai nel browser
            </li>
            <li className="flex gap-2">
              <span className="text-accent-400">◆</span> Export statico e file di progetto sempre scaricabili
            </li>
          </ul>
        </div>

        <p className="max-w-sm text-[11px] text-ink-600">
          Sessione firmata HMAC. {isLocalSecret() ? "Su questa installazione la chiave di firma è quella locale di sviluppo: aggiungi ATELIER_SESSION_SECRET per usarla fra macchine." : "Chiave di firma presa da ATELIER_SESSION_SECRET."}
        </p>
      </section>

      <section className="relative grid place-items-center p-6">
        <div className="card w-full max-w-md p-6">
          <div className="mb-5 grid gap-1">
            <span className="mono-label">accesso</span>
            <h2 className="text-2xl font-semibold tracking-tight">Entra in Atelier</h2>
            <p className="text-xs text-ink-500">
              Con GitHub o Google, oppure in locale. Dopo l&apos;accesso torni a <code className="text-ink-300">{next}</code>.
            </p>
          </div>

          <LoginForm
            providers={providers}
            next={next}
            error={read("error")}
            detail={read("detail")}
            hint={read("hint")}
          />

          <p className="mt-5 text-[11px] text-ink-600">
            <Link className="underline hover:text-ink-300" href="/">
              Torna alla vetrina
            </Link>{" "}
            · nessun account? Guarda un&apos;anteprima generata dal vivo nella home.
          </p>
        </div>
      </section>
    </main>
  );
}
