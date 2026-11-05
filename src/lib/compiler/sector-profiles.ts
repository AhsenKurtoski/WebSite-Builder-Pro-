import type { Sector } from "@/lib/schema/site";
import type { StylePreset } from "@/lib/design/tokens";

/**
 * Profili di settore.
 *
 * Non sono template: sono *contenuti di partenza* che il composer usa per
 * scrivere un sito credibile in assenza di AI (o come base che l'AI riscrive).
 * Il markup, le varianti e lo stile restano decisioni del composer.
 */

export type ServiceItem = { icon: string; title: string; text: string };

/**
 * La voce di un settore: i micro-testi che cambiano il tono del sito.
 *
 * Esistono perché il copy generico si sente subito: "sopralluogo", "progetto",
 * "preventivo" letti sul sito di una pizzeria smascherano un template. Queste
 * frasi sono parte del contenuto, non un dettaglio di stile.
 *
 * `{area}` viene sostituito con la zona di servizio (o rimosso), `{role}` con il
 * ruolo della persona.
 */
export type SectorVoice = {
  /** Etichetta del pulsante principale verso i contatti. */
  ctaLabel: string;
  ctaTitle: string;
  ctaText: string;
  /**
   * Frase di copertura territoriale, usata solo se il brief indica una città.
   * Vuota per chi non ha un bacino locale (software, e-commerce).
   */
  areaClause: string;
  pricingNote: string;
  aboutMethod: string;
  aboutTeam: string;
  bioTemplate: string;
  statsTitle: string;
  /** Titolo della sezione servizi in home: diverso dal titolo dell'hero. */
  servicesTitle: string;
  servicesIntro: string;
  servicesCtaTitle: string;
  servicesCtaText: string;
  contactTitle: string;
  /** Riga su appuntamenti e accesso, adattata al settore. */
  contactNote: string;
};

export type SectorProfile = {
  label: string;
  /** Parole chiave che fanno riconoscere il settore da un prompt in italiano. */
  keywords: string[];
  preset: StylePreset;
  paletteHarmony: "analogous" | "complementary" | "triadic" | "split";
  primaryL: number;
  heading: string;
  tagline: string;
  intro: string;
  services: ServiceItem[];
  features: ServiceItem[];
  process: { title: string; text: string }[];
  faq: { question: string; answer: string }[];
  testimonials: { quote: string; author: string; role: string }[];
  stats: { value: string; label: string }[];
  plans: { name: string; price: string; period: string; description: string; features: string[]; featured?: boolean }[];
  teamRoles: string[];
  galleryCaptions: string[];
  pages: { path: string; title: string; kind: "page" | "legal" | "utility" }[];
  hasBlog: boolean;
  navLabels: { services: string; about: string; pricing?: string; blog?: string };
  voice: SectorVoice;
};

const GENERIC: SectorProfile = {
  label: "attività professionale",
  keywords: [],
  preset: "editorial",
  paletteHarmony: "analogous",
  primaryL: 0.52,
  heading: "Soluzioni su misura per la tua attività",
  tagline: "Un partner unico, dalla prima consulenza alla consegna.",
  intro:
    "Lavoriamo con metodo e trasparenza: capiamo l'obiettivo, definiamo il percorso e lo portiamo a termine con tempi e costi chiari.",
  services: [
    { icon: "sparkles", title: "Consulenza iniziale", text: "Analizziamo la situazione e definiamo priorità e obiettivi concreti." },
    { icon: "briefcase", title: "Progetto su misura", text: "Costruiamo la soluzione sulle tue esigenze, senza pacchetti preconfezionati." },
    { icon: "activity", title: "Esecuzione", text: "Seguiamo ogni fase con referenti definiti e aggiornamenti regolari." },
    { icon: "shield", title: "Garanzia", text: "Copertura e assistenza dopo la consegna, con tempi di risposta concordati." },
    { icon: "users", title: "Assistenza continuativa", text: "Restiamo al tuo fianco nel tempo, non solo nella fase iniziale." },
    { icon: "award", title: "Qualità verificata", text: "Materiali, fornitori e processi selezionati e verificati." },
  ],
  features: [
    { icon: "clock", title: "Tempi rispettati", text: "Scadenze concordate e verificate in anticipo." },
    { icon: "scale", title: "Preventivi chiari", text: "Nessun costo nascosto, ogni voce è spiegata." },
    { icon: "heart", title: "Rapporto diretto", text: "Parli sempre con chi lavora al tuo progetto." },
  ],
  process: [
    { title: "Primo contatto", text: "Ascoltiamo la richiesta e capiamo se possiamo essere utili." },
    { title: "Sopralluogo o analisi", text: "Raccogliamo i dati necessari per una proposta realistica." },
    { title: "Preventivo dettagliato", text: "Voci, tempi e materiali: tutto per iscritto." },
    { title: "Esecuzione", text: "Lavoriamo secondo il piano, con aggiornamenti durante il percorso." },
    { title: "Consegna e assistenza", text: "Verifichiamo insieme il risultato e restiamo disponibili." },
  ],
  faq: [
    { question: "Come si richiede un preventivo?", answer: "Compila il modulo con qualche dettaglio in più: rispondiamo entro un giorno lavorativo con le domande utili a formulare una proposta." },
    { question: "I preventivi sono gratuiti?", answer: "Sì. Il sopralluogo e il preventivo non hanno costo e non impegnano a procedere." },
    { question: "Quanto tempo serve?", answer: "Dipende dall'intervento: dopo il primo contatto indichiamo una data realistica e la confermiamo per iscritto." },
    { question: "Lavorate anche fuori zona?", answer: "Valutiamo caso per caso in base alla distanza e alla dimensione dell'intervento." },
  ],
  testimonials: [
    { quote: "Preventivo chiaro e lavoro eseguito nei tempi indicati. Nessuna sorpresa in fattura.", author: "Marco R.", role: "Cliente privato" },
    { quote: "Hanno capito subito il problema e proposto la soluzione più semplice, non la più costosa.", author: "Giulia P.", role: "Amministratrice" },
    { quote: "Comunicazione precisa, risposte rapide, lavoro curato nei dettagli.", author: "Studio Bendinelli", role: "Cliente aziendale" },
  ],
  stats: [
    { value: "12+", label: "Anni di attività" },
    { value: "480", label: "Interventi completati" },
    { value: "4,9/5", label: "Valutazione media" },
  ],
  plans: [
    { name: "Intervento base", price: "da 190 €", period: "", description: "Ideale per necessità singole e rapide.", features: ["Sopralluogo incluso", "Preventivo scritto", "Garanzia 12 mesi"] },
    { name: "Progetto completo", price: "da 690 €", period: "", description: "Il percorso più scelto: analisi, esecuzione e verifica.", features: ["Analisi iniziale", "Piano dettagliato", "Referente dedicato", "Garanzia 24 mesi"], },
    { name: "Assistenza continuativa", price: "su misura", period: "", description: "Per chi vuole un partner fisso nel tempo.", features: ["Interventi programmati", "Canale diretto", "Priorità sugli appuntamenti"] },
  ],
  teamRoles: ["Responsabile di progetto", "Tecnico senior", "Coordinamento clienti"],
  galleryCaptions: ["Intervento completato", "Dettaglio della lavorazione", "Risultato finale", "Fase di preparazione"],
  pages: [
    { path: "/servizi", title: "Servizi", kind: "page" },
    { path: "/chi-siamo", title: "Chi siamo", kind: "page" },
    { path: "/contatti", title: "Contatti", kind: "page" },
    { path: "/privacy", title: "Privacy", kind: "legal" },
    { path: "/cookie", title: "Cookie", kind: "legal" },
  ],
  hasBlog: false,
  navLabels: { services: "Servizi", about: "Chi siamo" },
  voice: {
    ctaLabel: "Richiedi un preventivo",
    ctaTitle: "Parliamo del tuo progetto",
    ctaText: "Raccontaci cosa ti serve: rispondiamo entro un giorno lavorativo con le domande utili a formulare una proposta.{area}",
    areaClause: "Operiamo a {city} e provincia.",
    pricingNote: "Gli importi sono indicativi: vengono confermati dopo la verifica dei requisiti.",
    aboutMethod:
      "Ogni incarico parte dalla raccolta dei dati necessari, prosegue con un piano scritto e si chiude con una verifica insieme. Non chiediamo di fidarsi: chiediamo di controllare i risultati.",
    aboutTeam:
      "Il team è ristretto e stabile: chi ti risponde al telefono è la stessa persona che segue il lavoro, dall'inizio alla consegna.",
    bioTemplate: "{role} con esperienza diretta sul campo. Segue i lavori dalla prima valutazione alla consegna.",
    statsTitle: "Numeri che possiamo dimostrare",
    servicesTitle: "Quello che facciamo, nel dettaglio",
    servicesIntro: "Servizi descritti senza giri di parole: cosa comprende ogni intervento e cosa cambia da una situazione all'altra.",
    servicesCtaTitle: "Ti serve un preventivo?",
    servicesCtaText: "Scrivici due righe: ti rispondiamo con le domande necessarie e una stima realistica.{area}",
    contactTitle: "Richiedi informazioni o un preventivo",
    contactNote: "Gli appuntamenti si concordano in anticipo: così evitiamo attese e dedichiamo a ogni richiesta il tempo che serve.",
  },
};

export const SECTOR_PROFILES: Record<Sector, SectorProfile> = {
  generic: GENERIC,

  restaurant: {
    ...GENERIC,
    label: "ristorante",
    keywords: ["ristorante", "pizzeria", "trattoria", "osteria", "cucina", "chef", "menù", "menu", "bistrot", "gelateria", "panetteria", "bar"],
    preset: "editorial",
    paletteHarmony: "triadic",
    primaryL: 0.44,
    heading: "Cucina del territorio, servita con cura",
    tagline: "Materie prime scelte ogni giorno, ricette che rispettano la stagione.",
    intro:
      "In cucina lavoriamo prodotti freschi e fornitori locali. La carta cambia con le stagioni, il servizio resta lo stesso: attento, senza fretta.",
    voice: {
      ctaLabel: "Prenota un tavolo",
      ctaTitle: "Il tavolo è pronto quando vuoi",
      ctaText: "Chiamaci o scrivici indicando data e numero di persone: ti confermiamo la disponibilità entro poche ore.{area}",
      areaClause: "Vi aspettiamo a {city} e dintorni.",
      pricingNote: "I prezzi sono indicativi e seguono il mercato e la stagione degli ingredienti.",
      aboutMethod:
        "In cucina si lavora con quello che il mercato offre: la carta cambia durante l'anno e i piatti del giorno si decidono la mattina. Chi ha intolleranze o esigenze particolari lo dice all'ordine e ci organizziamo.",
      aboutTeam:
        "In cucina e in sala siamo in pochi e ci conosciamo da anni: chi ti accoglie è la stessa persona che ti consiglia il vino e ti saluta alla fine.",
      bioTemplate: "{role} in cucina dal primo giorno: cura preparazioni, tempi di servizio e scelta delle materie prime.",
      statsTitle: "Quello che c'è dietro il menù",
      servicesTitle: "Dalla cucina alla tavola",
      servicesIntro: "Piatti preparati ogni giorno con materie prime scelte, più qualche opzione per chi segue diete particolari.",
      servicesCtaTitle: "Cena di gruppo o cerimonia?",
      servicesCtaText: "Prepariamo menù dedicati per compleanni, cerimonie e cene aziendali: dicci in quanti siete e cosa vi piace.{area}",
      contactTitle: "Prenota un tavolo",
      contactNote: "La prenotazione è consigliata nel fine settimana, ma teniamo sempre qualche tavolo per chi passa senza prenotare. Per i gruppi da otto persone in su prepariamo un menù concordato.",
    },
    services: [
      { icon: "utensil", title: "Antipasti", text: "Taglieri di salumi e formaggi del territorio, verdure sott'olio di produzione propria." },
      { icon: "leaf", title: "Primi piatti", text: "Pasta fresca tirata a mano ogni mattina, ragù a cottura lenta." },
      { icon: "activity", title: "Secondi", text: "Carni alla griglia e pesce del giorno, secondo il mercato." },
      { icon: "heart", title: "Dolci", text: "Dessert preparati in casa, con opzioni senza glutine e vegane." },
      { icon: "globe", title: "Carta dei vini", text: "Etichette locali e nazionali, con possibilità di mescita al bicchiere." },
      { icon: "users", title: "Eventi e gruppi", text: "Menù dedicati per compleanni, cerimonie e cene aziendali." },
    ],
    features: [
      { icon: "leaf", title: "Prodotti del territorio", text: "Fornitori selezionati a pochi chilometri." },
      { icon: "clock", title: "Prenotazione rapida", text: "Confermiamo il tavolo entro poche ore." },
      { icon: "heart", title: "Opzioni per tutti", text: "Piatti vegetariani, vegani e senza glutine." },
    ],
    process: [
      { title: "Prenota", text: "Chiama o scrivi indicando data, ora e numero di persone." },
      { title: "Confermiamo", text: "Ti rispondiamo con la disponibilità e i posti assegnati." },
      { title: "Vieni a trovarci", text: "Il tavolo è pronto all'orario indicato." },
    ],
    faq: [
      { question: "Serve prenotare?", answer: "Consigliato, soprattutto nel fine settimana. Teniamo sempre qualche tavolo per chi passa senza prenotare." },
      { question: "Avete piatti senza glutine?", answer: "Sì, una parte della carta è senza glutine e prepariamo i piatti in area separata." },
      { question: "Ci sono opzioni vegetariane?", answer: "Sempre: almeno tre antipasti e tre primi vegetariani, con varianti vegane su richiesta." },
      { question: "Organizzate cene per gruppi?", answer: "Sì, con menù concordati in anticipo per gruppi da 8 persone in su." },
    ],
    testimonials: [
      { quote: "Materie prime eccellenti e porzioni giuste. Il primo al ragù vale il viaggio.", author: "Chiara M.", role: "Cliente" },
      { quote: "Ci hanno accolti in otto con menù concordato: servizio preciso e conto onesto.", author: "Andrea T.", role: "Cena aziendale" },
      { quote: "Ambiente curato, personale gentile e carta dei vini ben scelta.", author: "Sara V.", role: "Cliente" },
    ],
    stats: [
      { value: "dal 2009", label: "In cucina" },
      { value: "90%", label: "Fornitori entro 50 km" },
      { value: "4,8/5", label: "Recensioni Google" },
    ],
    plans: [
      { name: "Menù pranzo", price: "16 €", period: "a persona", description: "Da lunedì a venerdì, primo, secondo e acqua.", features: ["Primo del giorno", "Secondo a scelta", "Acqua e caffè"] },
      { name: "Menù degustazione", price: "38 €", period: "a persona", description: "Quattro portate scelte dallo chef.", features: ["Quattro portate", "Benvenuto della casa", "Dolce incluso"], featured: true },
      { name: "Menù gruppi", price: "28 €", period: "a persona", description: "Per gruppi da 8 persone, da concordare.", features: ["Menù personalizzato", "Tavolo riservato", "Servizio dedicato"] },
    ],
    teamRoles: ["Chef", "Sous-chef", "Responsabile di sala"],
    galleryCaptions: ["Sala principale", "Primi fatti a mano", "Tagliere di salumi", "Dolci della casa", "Cantina", "Terrazza estiva"],
    pages: [
      { path: "/menu", title: "Menù", kind: "page" },
      { path: "/chi-siamo", title: "La nostra storia", kind: "page" },
      { path: "/contatti", title: "Prenota", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    navLabels: { services: "Menù", about: "Storia" },
  },

  legal: {
    ...GENERIC,
    label: "studio legale",
    keywords: ["legale", "avvocato", "avvocatura", "studio legale", "notaio", "consulenza legale", "diritto", "tribunale"],
    preset: "luxury",
    paletteHarmony: "analogous",
    primaryL: 0.34,
    heading: "Assistenza legale con metodo e riservatezza",
    tagline: "Consulenza e assistenza giudiziale per aziende e privati.",
    intro:
      "Affrontiamo ogni pratica con un piano chiaro: cosa è possibile ottenere, in quanto tempo e con quali costi. Senza promesse che non possiamo mantenere.",
    voice: {
      ctaLabel: "Richiedi una prima valutazione",
      ctaTitle: "Esponi il caso: ti diciamo se e come procedere",
      ctaText: "Scrivi due righe sulla questione: rispondiamo con le domande necessarie e indichiamo i passi possibili, senza impegno.{area}",
      areaClause: "Lo studio opera a {city} e nei distretti vicini.",
      pricingNote: "Gli importi sono indicativi: il compenso viene concordato per iscritto prima di iniziare l'incarico.",
      aboutMethod:
        "Ogni pratica comincia dall'analisi dei fatti e dei documenti: verifichiamo termini, rischi e possibilità concrete e diciamo con chiarezza se conviene agire. Se la strada migliore è un accordo, lo diciamo subito.",
      aboutTeam:
        "Lo studio è piccolo per scelta: chi ti risponde al telefono segue la tua pratica, senza passaggi intermedi né fascicoli che passano di mano.",
      bioTemplate: "{role}: segue le pratiche dall'analisi alla definizione, tenendo il cliente aggiornato a ogni passaggio rilevante.",
      statsTitle: "Lo studio in cifre",
      servicesTitle: "Le materie che seguiamo",
      servicesIntro: "Non trattiamo tutto: seguiamo le materie che conosciamo a fondo, con aggiornamento continuo su norme e giurisprudenza.",
      servicesCtaTitle: "Hai una scadenza vicina?",
      servicesCtaText: "Termini e notifiche hanno tempi precisi: scrivici subito e verifichiamo insieme cosa è ancora possibile fare.{area}",
      contactTitle: "Richiedi una prima valutazione",
      contactNote: "Il primo incontro si svolge in studio o in videocall, con i documenti essenziali già a disposizione. Le udienze telematiche sono gestite direttamente dallo studio.",
    },
    services: [
      { icon: "scale", title: "Diritto civile", text: "Contratti, locazioni, recupero crediti e responsabilità civile." },
      { icon: "briefcase", title: "Diritto del lavoro", text: "Assunzioni, licenziamenti, contenzioso e trattative sindacali." },
      { icon: "shield", title: "Diritto societario", text: "Costituzione, patti parasociali, crisi d'impresa e operazioni straordinarie." },
      { icon: "heart", title: "Diritto di famiglia", text: "Separazioni, divorzi, accordi di convivenza e tutela dei minori." },
      { icon: "lock", title: "Privacy e GDPR", text: "Adeguamento, registro dei trattamenti e gestione delle violazioni." },
      { icon: "users", title: "Contenzioso", text: "Assistenza in mediazione, arbitrato e processo." },
    ],
    features: [
      { icon: "message", title: "Prima valutazione gratuita", text: "Capiamo insieme se e come procedere." },
      { icon: "scale", title: "Costi trasparenti", text: "Preventivo scritto con fasi e importi." },
      { icon: "lock", title: "Riservatezza", text: "Documenti gestiti con protocolli interni." },
    ],
    process: [
      { title: "Colloquio conoscitivo", text: "Raccogliamo i fatti e i documenti essenziali." },
      { title: "Analisi della pratica", text: "Verifichiamo termini, rischi e possibilità concrete." },
      { title: "Proposta di incarico", text: "Fasi, tempi e compenso, sempre per iscritto." },
      { title: "Gestione del caso", text: "Ti aggiorniamo a ogni passaggio rilevante." },
    ],
    faq: [
      { question: "Come si svolge il primo incontro?", answer: "Può essere in studio o in videocall. Serve per capire i fatti e valutare se esistono i presupposti per agire." },
      { question: "Quanto costa l'assistenza?", answer: "Dipende dalla materia e dalla complessità. Ricevi sempre un preventivo scritto prima di iniziare, con possibilità di suddividerlo in fasi." },
      { question: "Seguite anche fuori dal distretto?", answer: "Sì, tramite corrispondenti negli altri distretti e con gestione telematica delle udienze dove consentito." },
      { question: "Come vengono gestiti i documenti?", answer: "Raccolta in area riservata con accesso tracciato, nel rispetto del segreto professionale e del GDPR." },
    ],
    testimonials: [
      { quote: "Mi hanno spiegato con precisione cosa potevo ottenere e cosa no. Raro e prezioso.", author: "Federica L.", role: "Privato" },
      { quote: "Gestione del contenzioso impeccabile, con aggiornamenti costanti e nessun costo imprevisto.", author: "Dott. Sanna", role: "Amministratore delegato" },
      { quote: "Preparati e disponibili: hanno trovato un accordo senza arrivare in tribunale.", author: "Pietro B.", role: "Cliente" },
    ],
    stats: [
      { value: "20 anni", label: "Di professione" },
      { value: "1.200+", label: "Pratiche concluse" },
      { value: "72h", label: "Tempo medio di risposta" },
    ],
    plans: [
      { name: "Consulenza", price: "da 120 €", period: "una tantum", description: "Parere scritto su una questione specifica.", features: ["Analisi della questione", "Parere scritto", "Indicazioni operative"] },
      { name: "Assistenza continuativa", price: "da 300 €", period: "al mese", description: "Per aziende che gestiscono contratti e contenzioso.", features: ["Canale diretto", "Bozze di contratti", "Aggiornamenti normativi"], featured: true },
      { name: "Contenzioso", price: "su preventivo", period: "", description: "Assistenza in giudizio con piani di pagamento per fase.", features: ["Studio del caso", "Atti e udienze", "Report periodici"] },
    ],
    teamRoles: ["Avvocato fondatore", "Avvocato senior", "Praticante abilitato"],
    galleryCaptions: ["Studio", "Sala riunioni", "Biblioteca giuridica"],
    pages: [
      { path: "/aree-di-attivita", title: "Aree di attività", kind: "page" },
      { path: "/studio", title: "Lo studio", kind: "page" },
      { path: "/contatti", title: "Contatti", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    navLabels: { services: "Aree di attività", about: "Lo studio" },
  },

  medical: {
    ...GENERIC,
    label: "studio medico",
    keywords: ["dentista", "studio dentistico", "medico", "fisioterapista", "studio medico", "chirurgo", "psicologo", "veterinario", "odontoiatra"],
    preset: "minimal",
    paletteHarmony: "analogous",
    primaryL: 0.58,
    heading: "Cure personalizzate, con tempi chiari",
    tagline: "Tecnologie moderne e attenzione alla persona, dalla prima visita al controllo.",
    intro:
      "Spieghiamo ogni passaggio prima di iniziare, con preventivi dettagliati e piani di cura graduati sulle tue esigenze reali.",
    voice: {
      ctaLabel: "Prenota la visita",
      ctaTitle: "Prenota la prima visita",
      ctaText: "Ti richiamiamo per fissare l'appuntamento nella fascia che preferisci, anche di sera o il sabato mattina.{area}",
      areaClause: "Lo studio si trova a {city}.",
      pricingNote: "Gli importi si riferiscono alle prestazioni indicate: il preventivo definitivo viene consegnato dopo la prima visita.",
      aboutMethod:
        "Ogni percorso parte da una diagnosi accurata e da un piano di cura scritto: cosa facciamo, in quante sedute e con quale spesa. Se una cura non serve, non la proponiamo.",
      aboutTeam:
        "Il personale è stabile: chi ti visita alla prima visita è la stessa persona che ti segue nei controlli successivi.",
      bioTemplate: "{role}: segue i pazienti dalla prima visita ai controlli, spiegando ogni passaggio prima di procedere.",
      statsTitle: "Lo studio in numeri",
      servicesTitle: "I trattamenti principali",
      servicesIntro: "Prima visita, prevenzione e cure mirate: ogni trattamento è preceduto da una spiegazione e da un preventivo scritto.",
      servicesCtaTitle: "Vuoi sapere cosa serve davvero?",
      servicesCtaText: "Prenoti una prima visita e ricevi un piano di cura scritto, con fasi e costi: poi decidi con calma se procedere.{area}",
      contactTitle: "Prenota una visita",
      contactNote: "Riceviamo solo su appuntamento, così ogni paziente ha il tempo che serve. Su richiesta sono disponibili fasce serali e sabato mattina.",
    },
    services: [
      { icon: "activity", title: "Prima visita", text: "Valutazione completa con diagnosi e piano di cura scritto." },
      { icon: "shield", title: "Prevenzione", text: "Igiene, controlli programmati e istruzioni per la cura quotidiana." },
      { icon: "sparkles", title: "Trattamenti estetici", text: "Interventi mirati, con materiali certificati e tecniche conservative." },
      { icon: "heart", title: "Gestione del dolore", text: "Protocolli di riduzione del fastidio e sedute senza fretta." },
      { icon: "calendar", title: "Appuntamenti flessibili", text: "Fasce orarie serali e sabato mattina, su richiesta." },
      { icon: "users", title: "Famiglie e bambini", text: "Percorsi dedicati ai più piccoli, con approccio graduale." },
    ],
    features: [
      { icon: "clock", title: "Puntualità", text: "Un paziente alla volta: il tuo orario viene rispettato." },
      { icon: "scale", title: "Preventivo scritto", text: "Sai cosa paghi prima di iniziare." },
      { icon: "shield", title: "Sterilizzazione tracciata", text: "Protocolli verificati e registrati." },
    ],
    process: [
      { title: "Prenoti la visita", text: "Online, telefonicamente o dal modulo del sito." },
      { title: "Prima visita", text: "Diagnosi, spiegazione e piano di cura scritto." },
      { title: "Piano concordato", text: "Decidi tu come e quando procedere, per fasi." },
      { title: "Controlli", text: "Appuntamenti di verifica programmati nel tempo." },
    ],
    faq: [
      { question: "Quanto dura la prima visita?", answer: "Circa 45 minuti: il tempo necessario per una valutazione completa senza fretta." },
      { question: "Posso rateizzare?", answer: "Sì, per i piani di cura più estesi concordiamo il pagamento per fasi o in rate mensili." },
      { question: "Ricevete il sabato?", answer: "Sì, su appuntamento, con un numero limitato di posti." },
      { question: "Le cure sono dolorose?", answer: "Usiamo protocolli di riduzione del fastidio e anestesie moderne. Se l'intervento lo richiede, programmiamo sedute dedicate e più brevi." },
    ],
    testimonials: [
      { quote: "Mi hanno spiegato tutto con calma e il conto è stato esattamente quello previsto.", author: "Elena C.", role: "Paziente" },
      { quote: "Puntualissimi e gentili, anche con mia figlia che aveva paura.", author: "Luca D.", role: "Genitore" },
      { quote: "Finalmente uno studio dove non ti senti un numero.", author: "Margherita S.", role: "Paziente" },
    ],
    stats: [
      { value: "8.400", label: "Visite all'anno" },
      { value: "30 min", label: "Tempo medio di attesa" },
      { value: "4,9/5", label: "Soddisfazione pazienti" },
    ],
    plans: [
      { name: "Prima visita", price: "gratuita", period: "", description: "Valutazione con piano di cura scritto.", features: ["Visita completa", "Piano di cura scritto", "Preventivo dettagliato"] },
      { name: "Percorso base", price: "da 240 €", period: "", description: "Igiene e trattamenti di prevenzione.", features: ["Igiene completa", "Controllo a 6 mesi", "Istruzioni personalizzate"] },
      { name: "Piano completo", price: "su misura", period: "", description: "Percorso esteso, suddiviso per fasi.", features: ["Radiografie incluse", "Fasi concordate", "Pagamento rateale"], featured: true },
    ],
    teamRoles: ["Direttore sanitario", "Specialista", "Igienista"],
    galleryCaptions: ["Sala di attesa", "Studio operatorio", "Strumentazione"],
    pages: [
      { path: "/trattamenti", title: "Trattamenti", kind: "page" },
      { path: "/studio", title: "Lo studio", kind: "page" },
      { path: "/contatti", title: "Prenota", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    navLabels: { services: "Trattamenti", about: "Lo studio" },
  },

  fitness: {
    ...GENERIC,
    label: "palestra",
    keywords: ["palestra", "personal trainer", "fitness", "crossfit", "pilates", "yoga", "allenamento", "gym"],
    preset: "brutalist",
    paletteHarmony: "complementary",
    primaryL: 0.62,
    heading: "Allenati con un piano, non con un abbonamento qualunque",
    tagline: "Programmi misurati, sala mai affollata, risultati verificati.",
    intro:
      "Dopo una prova capiamo da dove parti, cosa vuoi ottenere e in quanto tempo. Poi costruiamo il piano e lo aggiustiamo strada facendo.",
    voice: {
      ctaLabel: "Prenota la prova gratuita",
      ctaTitle: "Prova un allenamento, poi decidi",
      ctaText: "Vieni a provare senza impegno: ti mostriamo come lavoriamo e misuriamo il punto di partenza.{area}",
      areaClause: "La sala è a {city}.",
      pricingNote: "Le quote sono indicative: formule mensili e pacchetti, senza vincoli annuali.",
      aboutMethod:
        "Il primo allenamento serve a capire da dove parti, non a venderti un abbonamento: test iniziali, obiettivo scritto e programma settimanale. Ogni quattro settimane misuriamo e correggiamo.",
      aboutTeam:
        "Gli allenatori sono in sala, non in ufficio: gruppi ridotti e correzioni continue, mai un programma lasciato al caso.",
      bioTemplate: "{role}: costruisce i programmi, segue le progressioni e verifica i risultati a ogni ciclo.",
      statsTitle: "Numeri della sala",
      servicesTitle: "Come ci alleniamo",
      servicesIntro: "Sala libera, corsi a gruppi ridotti e percorsi individuali: cambia il livello di supervisione, non la qualità del lavoro.",
      servicesCtaTitle: "Primo allenamento gratuito",
      servicesCtaText: "Prenota la prova: ti facciamo provare le attività che ti interessano e poi scegli il percorso.{area}",
      contactTitle: "Prenota la prova gratuita",
      contactNote: "Gli accessi nelle fasce di punta sono limitati, così non trovi code all'attrezzatura. Il primo allenamento è gratuito e su appuntamento.",
    },
    services: [
      { icon: "activity", title: "Sala pesi", text: "Attrezzatura completa, libera e guidata, con schede aggiornate." },
      { icon: "users", title: "Personal training", text: "Sessioni uno a uno con programma dedicato e verifica ogni mese." },
      { icon: "heart", title: "Corsi di gruppo", text: "Functional, mobility e HIIT con gruppi massimo di 12 persone." },
      { icon: "leaf", title: "Mobilità e postura", text: "Lavoro specifico per chi passa molte ore seduto." },
      { icon: "calendar", title: "Prova gratuita", text: "Un allenamento di prova per capire come lavoriamo." },
      { icon: "award", title: "Percorsi a obiettivo", text: "Preparazione a gare amatoriali, ricomposizione, forza." },
    ],
    features: [
      { icon: "shield", title: "Gruppi ridotti", text: "Massimo 12 persone per ogni corso." },
      { icon: "activity", title: "Check ogni 4 settimane", text: "Misuriamo, non andiamo a sensazione." },
      { icon: "clock", title: "Orari ampi", text: "Aperti dalle 6:30 alle 22:30, sabato incluso." },
    ],
    process: [
      { title: "Prova", text: "Un allenamento gratuito per conoscerci." },
      { title: "Valutazione", text: "Test iniziali e definizione dell'obiettivo." },
      { title: "Programma", text: "Piano settimanale con carichi e progressioni." },
      { title: "Verifiche", text: "Controlli ogni quattro settimane e aggiustamenti." },
    ],
    faq: [
      { question: "Serve esperienza per iniziare?", answer: "No: la maggior parte delle persone inizia da zero. I primi allenamenti sono dedicati alla tecnica." },
      { question: "Devo firmare un abbonamento annuale?", answer: "No. Ci sono formule mensili e pacchetti, senza vincoli annuali." },
      { question: "Posso congelare l'abbonamento?", answer: "Sì, fino a 4 settimane all'anno per motivi di salute o viaggio." },
      { question: "Quante persone ci sono in sala?", answer: "Limitiamo gli accessi nelle fasce di punta: non trovi code all'attrezzatura." },
    ],
    testimonials: [
      { quote: "In cinque mesi ho ripreso a fare quello che facevo anni fa. Il piano è chiaro e fattibile.", author: "Davide N.", role: "Cliente da 2 anni" },
      { quote: "Gruppi piccoli: ti seguono davvero e correggono la tecnica.", author: "Ilaria G.", role: "Corso functional" },
      { quote: "Mi hanno preparato alla prima gara con un programma realistico, senza farmi saltare gli allenamenti.", author: "Simone F.", role: "Runner" },
    ],
    stats: [
      { value: "620", label: "Iscritti attivi" },
      { value: "12", label: "Massimo per corso" },
      { value: "89%", label: "Rinnovo annuale" },
    ],
    plans: [
      { name: "Mensile open", price: "49 €", period: "al mese", description: "Accesso alla sala negli orari di apertura.", features: ["Sala libera", "Scheda iniziale", "Nessun vincolo"] },
      { name: "Corsi + sala", price: "79 €", period: "al mese", description: "Il percorso più scelto.", features: ["Corsi illimitati", "Sala libera", "Check ogni 4 settimane"], featured: true },
      { name: "Personal", price: "da 32 €", period: "a sessione", description: "Uno a uno, con programma dedicato.", features: ["Programma su misura", "Misurazioni", "Orari prioritari"] },
    ],
    teamRoles: ["Responsabile tecnico", "Personal trainer", "Istruttrice corsi"],
    galleryCaptions: ["Sala pesi", "Area functional", "Corsi di gruppo", "Zona mobility"],
    pages: [
      { path: "/corsi", title: "Corsi", kind: "page" },
      { path: "/allenatori", title: "Allenatori", kind: "page" },
      { path: "/contatti", title: "Prova gratuita", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    navLabels: { services: "Corsi", about: "Allenatori" },
  },

  saas: {
    ...GENERIC,
    label: "software",
    keywords: ["saas", "software", "app", "piattaforma", "startup", "gestionale", "crm", "software house", "ai", "dashboard"],
    preset: "tech",
    paletteHarmony: "split",
    primaryL: 0.6,
    heading: "Il gestionale che il tuo team userà davvero",
    tagline: "Meno fogli di calcolo, meno errori, più tempo per il lavoro che conta.",
    intro:
      "Sostituisce i processi manuali con un unico posto dove i dati sono sempre aggiornati. Si attiva in un pomeriggio, non in un trimestre.",
    voice: {
      ctaLabel: "Prova gratis 14 giorni",
      ctaTitle: "Provalo con i tuoi dati",
      ctaText: "Attiva la prova senza carta di credito: importiamo i dati esistenti e il team inizia a lavorare lo stesso giorno.{area}",
      areaClause: "",
      pricingNote: "I prezzi sono per utente attivo, senza costi di attivazione né penali di uscita.",
      aboutMethod:
        "Il prodotto nasce da richieste precise: ogni funzione nuova parte da un problema reale segnalato da chi lo usa. Il rilascio è settimanale e le note di versione sono pubbliche.",
      aboutTeam:
        "Siamo un team piccolo: chi sviluppa parla direttamente con chi usa il software, anche durante migrazione e formazione.",
      bioTemplate: "{role}: segue prodotto e clienti, dalle richieste di miglioramento all'attivazione degli account.",
      statsTitle: "Numeri del servizio",
      servicesTitle: "Cosa c'è dentro",
      servicesIntro: "Funzioni pensate per il lavoro quotidiano: si attivano subito, senza configurazioni lunghe né consulenti esterni.",
      servicesCtaTitle: "Domande tecniche?",
      servicesCtaText: "Possiamo fare una demo sui tuoi casi d'uso o rispondere via email: nessun passaggio commerciale obbligato.{area}",
      contactTitle: "Prova il prodotto o parlaci",
      contactNote: "La prova dura 14 giorni con tutte le funzioni attive, senza carta di credito. Alla fine puoi esportare i dati in qualsiasi momento.",
    },
    services: [
      { icon: "zap", title: "Automazioni", text: "Regole che smistano, notificano e aggiornano al posto tuo." },
      { icon: "users", title: "Collaborazione", text: "Commenti, menzioni e storico completo di ogni modifica." },
      { icon: "activity", title: "Cruscotti", text: "Metriche di squadra calcolate in tempo reale." },
      { icon: "code", title: "API e webhook", text: "Integrazione con quello che usi già, senza lavori manuali." },
      { icon: "lock", title: "Sicurezza e ruoli", text: "Permessi granulari, log di accesso, dati cifrati." },
      { icon: "globe", title: "Multilingua", text: "Interfaccia in italiano e inglese, con formati locali." },
    ],
    features: [
      { icon: "clock", title: "Attivo in un giorno", text: "Importiamo i tuoi dati e la squadra inizia a lavorare." },
      { icon: "shield", title: "Dati in Europa", text: "Hosting europeo e backup giornalieri." },
      { icon: "message", title: "Supporto in italiano", text: "Risposta entro poche ore in orario lavorativo." },
    ],
    process: [
      { title: "Prova libera", text: "14 giorni senza carta di credito, tutte le funzioni attive." },
      { title: "Migrazione assistita", text: "Importiamo i dati esistenti e configuriamo i campi." },
      { title: "Formazione", text: "Sessione con il team per partire senza attriti." },
      { title: "Crescita", text: "Report periodici e funzioni nuove ogni mese." },
    ],
    faq: [
      { question: "Quanto dura la prova?", answer: "14 giorni con tutte le funzioni attive e senza carta di credito. Alla fine puoi esportare i dati se decidi di non procedere." },
      { question: "Posso importare i dati che ho già?", answer: "Sì, da file CSV o dai gestionali più diffusi. Il team di migrazione se ne occupa con te." },
      { question: "Dove sono ospitati i dati?", answer: "Su server europei con backup giornalieri e cifratura in transito e a riposo." },
      { question: "Come funziona la fatturazione?", answer: "Per utente attivo, mensile o annuale. Si può cambiare piano in qualsiasi momento." },
    ],
    testimonials: [
      { quote: "Abbiamo smesso di perdere richieste tra email e chat: tutto arriva nello stesso posto.", author: "Martina R.", role: "Responsabile operations" },
      { quote: "Migrazione fatta in due giorni, nessuno ha smesso di lavorare.", author: "Giacomo P.", role: "CTO" },
      { quote: "Le automazioni ci fanno risparmiare circa sei ore a settimana.", author: "Camilla B.", role: "Team lead" },
    ],
    stats: [
      { value: "-6h", label: "Lavoro manuale a settimana" },
      { value: "99,9%", label: "Uptime dichiarato" },
      { value: "1 giorno", label: "Per essere operativi" },
    ],
    plans: [
      { name: "Starter", price: "19 €", period: "utente/mese", description: "Per team fino a 5 persone.", features: ["Utenti illimitati", "Automazioni base", "Supporto email"] },
      { name: "Business", price: "39 €", period: "utente/mese", description: "Per team che cresce.", features: ["Automazioni avanzate", "API e webhook", "Supporto prioritario", "SSO"], featured: true },
      { name: "Enterprise", price: "su misura", period: "", description: "Esigenze di compliance e volumi elevati.", features: ["SLA concordato", "Onboarding dedicato", "Ambiente isolato"] },
    ],
    teamRoles: ["Fondatore", "Responsabile prodotto", "Supporto clienti"],
    galleryCaptions: ["Cruscotto", "Vista progetti", "Automazioni", "Report"],
    pages: [
      { path: "/funzioni", title: "Funzioni", kind: "page" },
      { path: "/prezzi", title: "Prezzi", kind: "page" },
      { path: "/blog", title: "Blog", kind: "page" },
      { path: "/contatti", title: "Contatti", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    hasBlog: true,
    navLabels: { services: "Funzioni", about: "Prezzi", pricing: "Prezzi", blog: "Blog" },
  },

  ecommerce: {
    ...GENERIC,
    label: "negozio online",
    keywords: ["ecommerce", "negozio", "shop", "vendita online", "prodotti", "artigianato online", "store"],
    preset: "minimal",
    paletteHarmony: "triadic",
    primaryL: 0.56,
    heading: "Prodotti scelti uno a uno, spediti in 48 ore",
    tagline: "Selezione curata, resi semplici, assistenza che risponde.",
    intro:
      "Lavoriamo con produttori che conosciamo e teniamo in magazzino quello che vendiamo: nessuna attesa di mesi, nessuna sorpresa sulla qualità.",
    voice: {
      ctaLabel: "Vai ai prodotti",
      ctaTitle: "Prima di ordinare, una domanda?",
      ctaText: "Scrivici per taglie, materiali o tempi di consegna: rispondiamo entro un giorno lavorativo, con spedizione in 48 ore.{area}",
      areaClause: "",
      pricingNote: "I prezzi sono in euro e comprendono l'IVA; la spedizione è gratuita sopra 79 €.",
      aboutMethod:
        "In catalogo c'è solo quello che abbiamo in magazzino: se un prodotto non è disponibile lo scriviamo, invece di far aspettare settimane. Spediamo entro 24 ore dall'ordine e seguiamo ogni reso di persona.",
      aboutTeam:
        "Il negozio è gestito da poche persone: chi risponde alle email è anche chi prepara i pacchi e controlla i resi.",
      bioTemplate: "{role}: si occupa della selezione dei prodotti, degli ordini e dell'assistenza ai clienti.",
      statsTitle: "Lo shop in cifre",
      servicesTitle: "Come funziona l'acquisto",
      servicesIntro: "Selezione, spedizione, resi e pagamenti: le condizioni sono queste, scritte prima dell'ordine.",
      servicesCtaTitle: "Dubbi su un prodotto?",
      servicesCtaText: "Chiedi misure, materiali o disponibilità: rispondiamo con foto reali e tempi di consegna effettivi.{area}",
      contactTitle: "Scrivici prima o dopo l'ordine",
      contactNote: "Per un ordine già effettuato indica il numero d'ordine: possiamo cambiare indirizzo o prodotto finché il pacco non è partito.",
    },
    services: [
      { icon: "briefcase", title: "Selezione curata", text: "Pochi prodotti, scelti e provati prima di metterli in vendita." },
      { icon: "truck", title: "Spedizione 48h", text: "Spedizione tracciata in tutta Italia, gratuita sopra 79 €." },
      { icon: "heart", title: "Resi in 30 giorni", text: "Reso semplice e rimborso entro pochi giorni lavorativi." },
      { icon: "shield", title: "Garanzia 2 anni", text: "Copertura legale completa su tutti i prodotti." },
      { icon: "message", title: "Assistenza reale", text: "Rispondiamo noi, entro un giorno lavorativo." },
      { icon: "leaf", title: "Imballi riciclabili", text: "Materiali riciclati e recuperabili al 100%." },
    ],
    features: [
      { icon: "truck", title: "Consegna rapida", text: "Ordini entro le 15:00 partono lo stesso giorno." },
      { icon: "lock", title: "Pagamenti sicuri", text: "Carta, PayPal e bonifico, con connessione cifrata." },
      { icon: "heart", title: "Reso senza domande", text: "30 giorni per cambiare idea." },
    ],
    process: [
      { title: "Scegli", text: "Filtra per categoria, materiale o prezzo." },
      { title: "Ordina", text: "Checkout in tre passaggi, anche senza account." },
      { title: "Ricevi", text: "Tracking via email entro 24 ore dalla spedizione." },
      { title: "Se non va bene", text: "Reso entro 30 giorni con etichetta prepagata." },
    ],
    faq: [
      { question: "Quanto costa la spedizione?", answer: "5,90 € in Italia, gratuita sopra 79 €. Le isole seguono le stesse tariffe." },
      { question: "Come funziona il reso?", answer: "Hai 30 giorni: scrivi al servizio clienti, ricevi l'etichetta e il rimborso parte alla consegna del reso." },
      { question: "I pagamenti sono sicuri?", answer: "Sì: circuito bancario con connessione cifrata. Non conserviamo i dati della carta." },
      { question: "Posso ordinare senza account?", answer: "Sì, il checkout funziona come ospite. L'account serve solo per lo storico ordini." },
    ],
    testimonials: [
      { quote: "Ordine arrivato in due giorni, imballo curato e prodotto esattamente come descritto.", author: "Valentina M.", role: "Cliente" },
      { quote: "Ho reso un articolo senza nessuna complicazione, rimborso in quattro giorni.", author: "Roberto C.", role: "Cliente" },
      { quote: "Assistenza veloce e concreta: hanno risposto in poche ore.", author: "Agnese D.", role: "Cliente" },
    ],
    stats: [
      { value: "48h", label: "Consegna media" },
      { value: "4,8/5", label: "Recensioni verificate" },
      { value: "30 gg", label: "Per il reso" },
    ],
    plans: [
      { name: "Prodotto singolo", price: "da 24 €", period: "", description: "Articoli sfusi, disponibili in magazzino.", features: ["Spedizione 48h", "Reso 30 giorni", "Garanzia 2 anni"] },
      { name: "Kit completo", price: "da 79 €", period: "", description: "La combinazione più richiesta, con spedizione gratuita.", features: ["Spedizione gratuita", "Confezione regalo", "Guida inclusa"], featured: true },
      { name: "Confezione famiglia", price: "da 149 €", period: "", description: "Formato convenienza per più persone.", features: ["Prezzo dedicato", "Spedizione gratuita", "Assistenza prioritaria"] },
    ],
    teamRoles: ["Fondatrice", "Responsabile magazzino", "Servizio clienti"],
    galleryCaptions: ["Prodotto in dettaglio", "Confezione", "Magazzino", "Spedizione", "Dettaglio materiale", "Kit completo"],
    pages: [
      { path: "/prodotti", title: "Prodotti", kind: "page" },
      { path: "/spedizioni-e-resi", title: "Spedizioni e resi", kind: "page" },
      { path: "/contatti", title: "Contatti", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    navLabels: { services: "Prodotti", about: "Spedizioni" },
  },

  agency: {
    ...GENERIC,
    label: "agenzia",
    keywords: ["agenzia", "marketing", "comunicazione", "studio grafico", "web agency", "branding", "social media", "advertising", "consulenza marketing"],
    preset: "glass",
    paletteHarmony: "split",
    primaryL: 0.58,
    heading: "Progetti che si misurano, non solo si presentano",
    tagline: "Strategia, contenuti e campagne con obiettivi definiti e risultati verificabili.",
    intro:
      "Partiamo da un obiettivo di business, non da un'idea creativa. Poi costruiamo il percorso più breve per raggiungerlo e lo misuriamo ogni mese.",
    voice: {
      ctaLabel: "Richiedi un'analisi",
      ctaTitle: "Partiamo da un obiettivo, non da un'idea",
      ctaText: "Raccontaci dove vuoi arrivare e in quanto tempo: rispondiamo con un primo parere e i numeri da guardare.{area}",
      areaClause: "Lavoriamo con clienti a {city} e in tutta Italia.",
      pricingNote: "Gli importi sono indicativi e vengono definiti dopo la fase di analisi, in base a obiettivi e canali.",
      aboutMethod:
        "Ogni progetto comincia da un'analisi di mercato e dai numeri attuali: definiamo obiettivi misurabili, canali e priorità. Ogni mese guardiamo i risultati e correggiamo, anche quando la correzione costa più lavoro.",
      aboutTeam:
        "Strategia, contenuti e campagne sono gestiti dallo stesso gruppo di persone: nessun reparto che scarica i problemi su un altro.",
      bioTemplate: "{role}: segue strategia e risultati dei progetti, con report verificabili e priorità dichiarate.",
      statsTitle: "Risultati misurati",
      servicesTitle: "Come lavoriamo sui progetti",
      servicesIntro: "Strategia, contenuti, campagne e misurazione: ogni attività ha un obiettivo dichiarato prima di iniziare.",
      servicesCtaTitle: "Ti serve un piano, non solo creatività?",
      servicesCtaText: "Fissiamo una call di mezz'ora: usciamo con due o tre indicazioni concrete da applicare subito.{area}",
      contactTitle: "Raccontaci il progetto",
      contactNote: "Per valutare una proposta ci servono obiettivo, budget indicativo e canali già attivi. La prima call dura mezz'ora e non è una presentazione commerciale.",
    },
    services: [
      { icon: "sparkles", title: "Strategia di marca", text: "Posizionamento, messaggi chiave e tono di voce." },
      { icon: "globe", title: "Siti e piattaforme", text: "Progettazione, contenuti e sviluppo, pronti a convertire." },
      { icon: "activity", title: "Campagne", text: "Da 1.500 € di budget, con report quindicinali." },
      { icon: "message", title: "Contenuti", text: "Testi, foto, video e materiali per i canali che usi davvero." },
      { icon: "users", title: "Social", text: "Piano editoriale, gestione e community." },
      { icon: "award", title: "Grafica e materiali", text: "Identità visiva coerente su stampa e digitale." },
    ],
    features: [
      { icon: "activity", title: "Report trasparenti", text: "Numeri reali, inclusi quelli che non funzionano." },
      { icon: "calendar", title: "Un referente solo", text: "Parli con chi lavora al progetto." },
      { icon: "clock", title: "Risposte in 24h", text: "Nessun ticket che si perde." },
    ],
    process: [
      { title: "Analisi", text: "Mercato, concorrenti e posizionamento attuale." },
      { title: "Strategia", text: "Obiettivi, messaggi e canali con priorità." },
      { title: "Esecuzione", text: "Design, contenuti e campagne in cicli brevi." },
      { title: "Misurazione", text: "Risultati, correzioni e nuovo ciclo." },
    ],
    faq: [
      { question: "Qual è il budget minimo di una campagna?", answer: "Lavoriamo da 1.500 € di investimento pubblicitario. Sotto quella cifra i dati non sono sufficienti per ottimizzare." },
      { question: "In quanto tempo si vedono i risultati?", answer: "Le campagne danno segnali in 2-3 settimane. Il lavoro su marca e SEO richiede 3-6 mesi." },
      { question: "Lavorate con contratti lunghi?", answer: "Il primo periodo è di 3 mesi, poi si procede mese per mese: se non portiamo risultati, puoi fermarti." },
      { question: "Chi realizza i contenuti?", answer: "Il nostro team, con fotografi e videomaker selezionati quando serve." },
    ],
    testimonials: [
      { quote: "Primo mese: meno lead ma molto più qualificati. Il costo per cliente è sceso del 40%.", author: "Emanuele T.", role: "Titolare" },
      { quote: "Ci hanno portato un metodo, non solo creatività: ora sappiamo cosa funziona.", author: "Laura N.", role: "Marketing manager" },
      { quote: "Report chiari e nessuna richiesta di budget extra non giustificata.", author: "Fabio S.", role: "Founder" },
    ],
    stats: [
      { value: "-40%", label: "Costo per lead" },
      { value: "18", label: "Clienti attivi" },
      { value: "6 anni", label: "Di attività" },
    ],
    plans: [
      { name: "Setup strategico", price: "1.900 €", period: "una tantum", description: "Analisi, posizionamento e piano.", features: ["Ricerca mercato", "Messaggi chiave", "Piano canali"] },
      { name: "Gestione mensile", price: "da 1.200 €", period: "al mese", description: "Esecuzione continuativa e misurazione.", features: ["Contenuti", "Campagne", "Report quindicinale"], featured: true },
      { name: "Progetto dedicato", price: "su misura", period: "", description: "Sito, brand o lancio con team dedicato.", features: ["Team dedicato", "Tempistiche concordate", "Garanzia sul risultato"] },
    ],
    teamRoles: ["Direttore strategia", "Art director", "Responsabile campagne"],
    galleryCaptions: ["Progetto di brand", "Campagna social", "Sito realizzato", "Materiali stampa"],
    pages: [
      { path: "/servizi", title: "Servizi", kind: "page" },
      { path: "/lavori", title: "Lavori", kind: "page" },
      { path: "/blog", title: "Blog", kind: "page" },
      { path: "/contatti", title: "Contatti", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    hasBlog: true,
    navLabels: { services: "Servizi", about: "Lavori", blog: "Blog" },
  },

  artisan: {
    ...GENERIC,
    label: "impresa artigiana",
    keywords: ["artigiano", "falegname", "idraulico", "elettricista", "sartoria", "officina", "ristrutturazione", "muratore", "impianti", "laboratorio"],
    preset: "editorial",
    paletteHarmony: "analogous",
    primaryL: 0.48,
    heading: "Lavori fatti a regola d'arte, con materiali che durano",
    tagline: "Preventivi chiari, tempi rispettati, garanzia scritta.",
    intro:
      "Sopralluogo gratuito, preventivo dettagliato e squadra fissa: sai chi entra in casa tua e cosa troverai alla fine.",
    voice: {
      ctaLabel: "Chiedi un sopralluogo gratuito",
      ctaTitle: "Sopralluogo gratuito, preventivo per iscritto",
      ctaText: "Descrivi il lavoro: passiamo a vedere e prepariamo un preventivo dettagliato con voci, materiali e tempi.{area}",
      areaClause: "Interveniamo a {city} e provincia.",
      pricingNote: "Gli importi sono di partenza e dipendono da misure e materiali: il preventivo scritto arriva dopo il sopralluogo.",
      aboutMethod:
        "Prima di parlare di prezzo guardiamo i luoghi e misuriamo: il preventivo elenca voci, materiali e tempi, con le varianti di spesa. In cantiere la squadra è sempre la stessa e ogni sera i locali restano in ordine.",
      aboutTeam:
        "Siamo artigiani, non intermediari: chi fa il sopralluogo è chi lavora in cantiere e chi risponde del risultato a fine lavoro.",
      bioTemplate: "{role}: coordina cantiere e fornitori, dalla misurazione al collaudo finale.",
      statsTitle: "Il mestiere in numeri",
      servicesTitle: "Cosa facciamo in concreto",
      servicesIntro: "Dal singolo intervento alla ristrutturazione completa: stesso metodo, stessa garanzia scritta su manodopera e materiali.",
      servicesCtaTitle: "Hai un lavoro da fare?",
      servicesCtaText: "Mandaci due foto e una misura: ti diciamo se serve un sopralluogo e in quanto tempo possiamo intervenire.{area}",
      contactTitle: "Chiedi un preventivo",
      contactNote: "Il sopralluogo è gratuito e senza impegno. Se il lavoro è urgente scrivilo nel messaggio: teniamo liberi alcuni slot per le emergenze.",
    },
    services: [
      { icon: "tool", title: "Sopralluogo gratuito", text: "Misuriamo, fotografiamo e verifichiamo lo stato dei luoghi." },
      { icon: "briefcase", title: "Preventivo dettagliato", text: "Voci, materiali e tempi, con alternative di spesa." },
      { icon: "activity", title: "Realizzazione", text: "Squadra fissa, cantiere ordinato e aggiornamenti." },
      { icon: "shield", title: "Garanzia scritta", text: "Copertura su manodopera e materiali." },
      { icon: "heart", title: "Manutenzione", text: "Interventi programmati e pronto intervento." },
      { icon: "award", title: "Materiali certificati", text: "Fornitori tracciati e prodotti conformi." },
    ],
    features: [
      { icon: "clock", title: "Tempi rispettati", text: "Data di consegna concordata per iscritto." },
      { icon: "scale", title: "Prezzo chiaro", text: "Nessun extra non approvato." },
      { icon: "shield", title: "Cantiere pulito", text: "Lasciamo i locali in ordine ogni sera." },
    ],
    process: [
      { title: "Sopralluogo", text: "Gratuito, entro pochi giorni dalla richiesta." },
      { title: "Preventivo", text: "Dettagliato, con tempi e varianti di spesa." },
      { title: "Cantiere", text: "Squadra fissa e aggiornamenti costanti." },
      { title: "Collaudo", text: "Verifica insieme e consegna della garanzia." },
    ],
    faq: [
      { question: "Il sopralluogo è gratuito?", answer: "Sì, sempre, senza impegno. Serve per un preventivo realistico." },
      { question: "Fate anche piccoli interventi?", answer: "Sì: dal singolo riparo alla ristrutturazione completa. Nessun lavoro è troppo piccolo." },
      { question: "Rilasciate fattura?", answer: "Sempre, con detrazione fiscale dove prevista per la tipologia di intervento." },
      { question: "Quanto dura il cantiere?", answer: "Lo indichiamo nel preventivo. Se qualcosa cambia, avvisiamo subito, non a fine lavoro." },
    ],
    testimonials: [
      { quote: "Cantiere pulito e tempi rispettati. Il preventivo non ha avuto un euro di scostamento.", author: "Famiglia Bertoni", role: "Ristrutturazione bagno" },
      { quote: "Precisi e disponibili a spiegare ogni passaggio.", author: "Nicola V.", role: "Cliente privato" },
      { quote: "Hanno risolto un problema che altri due non avevano capito.", author: "Condominio Le Vele", role: "Amministratore" },
    ],
    stats: [
      { value: "25 anni", label: "Di mestiere" },
      { value: "0", label: "Extra non concordati" },
      { value: "5 anni", label: "Di garanzia" },
    ],
    plans: [
      { name: "Intervento singolo", price: "da 120 €", period: "", description: "Riparazione o sostituzione rapida.", features: ["Sopralluogo gratuito", "Preventivo immediato", "Garanzia 12 mesi"] },
      { name: "Ristrutturazione", price: "su preventivo", period: "", description: "Interventi completi con squadra dedicata.", features: ["Progetto e materiali", "Direzione lavori", "Garanzia 5 anni"], featured: true },
      { name: "Manutenzione annuale", price: "da 240 €", period: "all'anno", description: "Controlli programmati con priorità.", features: ["Due visite l'anno", "Pronto intervento", "Sconto su altri lavori"] },
    ],
    teamRoles: ["Titolare", "Capo cantiere", "Apprendista"],
    galleryCaptions: ["Cantiere completato", "Dettaglio della posa", "Materiali in lavorazione", "Risultato finale"],
    pages: [
      { path: "/servizi", title: "Lavori", kind: "page" },
      { path: "/chi-siamo", title: "Chi siamo", kind: "page" },
      { path: "/contatti", title: "Preventivo", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    navLabels: { services: "Lavori", about: "Chi siamo" },
  },

  architecture: {
    ...GENERIC,
    label: "studio di architettura",
    keywords: [
      "architetto",
      "architettura",
      "studio di architettura",
      "progettazione",
      "direzione lavori",
      "interior design",
      "design d'interni",
      "arredamento",
      "pratiche edilizie",
      "rendering",
    ],
    preset: "minimal",
    paletteHarmony: "analogous",
    primaryL: 0.42,
    heading: "Progetti che partono da come si vive lo spazio",
    tagline: "Progettazione, pratiche e direzione lavori con un referente unico.",
    intro:
      "Ogni incarico comincia da un sopralluogo e da qualche domanda scomoda: come usi gli spazi oggi, cosa non funziona, quanto vuoi spendere. Da lì arrivano piante, materiali e un preventivo per fasi.",
    voice: {
      ctaLabel: "Prenota un sopralluogo",
      ctaTitle: "Raccontaci lo spazio che hai in mente",
      ctaText:
        "Fissiamo un sopralluogo: misuriamo, verifichiamo i vincoli e ti diciamo cosa è realistico fare e con quale budget.{area}",
      areaClause: "Progettiamo a {city} e in tutta Italia.",
      pricingNote:
        "Gli importi indicano il punto di partenza: onorario e lavori restano separati e vengono confermati dopo il rilievo.",
      aboutMethod:
        "Prima di disegnare misuriamo: il progetto nasce da piante reali, vincoli dichiarati e un budget condiviso. Le decisioni si prendono insieme, con tavole comprensibili anche a chi non è del mestiere.",
      aboutTeam:
        "Chi firma il progetto è chi segue il cantiere: nessun passaggio di consegna tra reparti, nessuna decisione che si perde per strada.",
      bioTemplate: "{role}: segue il progetto dalla prima pianta alla consegna delle chiavi.",
      statsTitle: "Il lavoro in numeri",
      servicesTitle: "Dalla prima idea al cantiere",
      servicesIntro: "Progettazione, pratiche, direzione lavori e interni: ogni fase ha documenti e tempi definiti.",
      servicesCtaTitle: "Hai uno spazio da ripensare?",
      servicesCtaText:
        "Mandaci pianta e foto: ti diciamo quali vincoli ci sono e cosa si può fare già prima del sopralluogo.{area}",
      contactTitle: "Prenota un sopralluogo",
      contactNote:
        "Il primo incontro dura circa un'ora sul posto: servono la pianta, se c'è, e un'idea di budget. Senza impegno.",
    },
    services: [
      { icon: "sparkles", title: "Progettazione", text: "Concept, distribuzione degli spazi e scelta dei materiali." },
      { icon: "tool", title: "Ristrutturazione", text: "Interventi completi, seguiti dal progetto al collaudo." },
      { icon: "heart", title: "Interior design", text: "Arredi, luci e finiture coerenti con l'uso reale degli spazi." },
      { icon: "activity", title: "Direzione lavori", text: "Cantiere coordinato, con tempi e costi sotto controllo." },
      { icon: "scale", title: "Pratiche edilizie", text: "CILA, SCIA e rapporti con gli uffici comunali." },
      { icon: "briefcase", title: "Consulenza preliminare", text: "Fattibilità, vincoli e budget prima di iniziare." },
    ],
    features: [
      { icon: "clock", title: "Fasi definite", text: "Sai cosa arriva e quando, a ogni passaggio." },
      { icon: "scale", title: "Costi trasparenti", text: "Onorario e lavori separati, senza voci nascoste." },
      { icon: "users", title: "Un solo referente", text: "Parli sempre con chi disegna il progetto." },
    ],
    process: [
      { title: "Sopralluogo", text: "Rilievo, vincoli e aspettative, senza impegno." },
      { title: "Concept", text: "Distribuzione, materiali e preventivo di massima." },
      { title: "Progetto esecutivo", text: "Tavole, capitolato e pratica edilizia." },
      { title: "Direzione lavori", text: "Cantiere seguito con visite programmate." },
      { title: "Consegna", text: "Verifica finale, documenti e cartella del fabbricato." },
    ],
    faq: [
      {
        question: "Quanto costa un progetto?",
        answer:
          "Dipende da metri quadri e complessità: dopo il sopralluogo arriva un preventivo per fasi, con onorario e lavori indicati separatamente.",
      },
      {
        question: "Seguite anche il cantiere?",
        answer:
          "Sì: la direzione lavori fa parte dell'incarico, con visite programmate e verbali scritti dopo ogni passaggio critico.",
      },
      {
        question: "Vi occupate delle pratiche comunali?",
        answer:
          "Sì, CILA e SCIA sono incluse nel progetto esecutivo: non devi coordinare tu tecnici e uffici.",
      },
      {
        question: "Lavorate fuori città?",
        answer:
          "Seguiamo progetti in tutta Italia; sui cantieri lontani concentriamo le visite e usiamo video-sopralluoghi per le verifiche rapide.",
      },
    ],
    testimonials: [
      { quote: "Hanno ridisegnato la distribuzione senza perdere un metro di casa: ora ogni stanza ha il suo senso.", author: "Chiara B.", role: "Cliente privato" },
      { quote: "Tempi del cantiere rispettati e nessuna sorpresa in fattura rispetto al preventivo per fasi.", author: "Nicola P.", role: "Cliente privato" },
      { quote: "Un referente solo per progetto ed esecuzione: abbiamo smesso di fare da tramite fra i tecnici.", author: "Studio Marchi", role: "Cliente aziendale" },
    ],
    stats: [
      { value: "180", label: "Progetti consegnati" },
      { value: "18 anni", label: "Di attività" },
      { value: "4,9/5", label: "Valutazione dei clienti" },
    ],
    plans: [
      { name: "Consulenza preliminare", price: "da 350 €", period: "", description: "Fattibilità e budget prima di decidere.", features: ["Sopralluogo", "Verifica dei vincoli", "Stima dei costi"] },
      { name: "Progetto completo", price: "da 2.400 €", period: "", description: "Dal concept alla pratica edilizia.", features: ["Concept e tavole", "Capitolato", "Pratica CILA o SCIA"], featured: true },
      { name: "Progetto e direzione lavori", price: "su misura", period: "", description: "Incarico esteso al cantiere e alla consegna.", features: ["Visite programmate", "Coordinamento delle imprese", "Verifica finale"] },
    ],
    teamRoles: ["Architetto titolare", "Architetto di progetto", "Interior designer"],
    galleryCaptions: ["Schizzo di studio", "Pianta del progetto", "Render degli interni", "Cantiere in corso", "Interno finito", "Dettaglio costruttivo"],
    pages: [
      { path: "/progetti", title: "Progetti", kind: "page" },
      { path: "/studio", title: "Studio", kind: "page" },
      { path: "/contatti", title: "Contatti", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    hasBlog: false,
    navLabels: { services: "Progetti", about: "Studio" },
  },

  realestate: {
    ...GENERIC,
    label: "agenzia immobiliare",
    keywords: ["immobiliare", "agente immobiliare", "case", "appartamenti", "affitto", "vendita immobili", "costruzioni", "property"],
    preset: "luxury",
    paletteHarmony: "analogous",
    primaryL: 0.4,
    heading: "Case trovate ascoltando, non solo pubblicando annunci",
    tagline: "Valutazioni oneste, visite senza perdite di tempo, trattative gestite con metodo.",
    intro:
      "Sappiamo cosa cercano davvero i compratori delle nostre zone e lo confrontiamo con quello che la casa può offrire, senza gonfiare le aspettative.",
    voice: {
      ctaLabel: "Richiedi una valutazione",
      ctaTitle: "Scopri quanto vale davvero la tua casa",
      ctaText: "Fissiamo il sopralluogo: alla fine ricevi una stima scritta basata sui dati reali di compravendita della zona.{area}",
      areaClause: "Operiamo a {city} e nelle zone limitrofe.",
      pricingNote: "La valutazione è gratuita. La provvigione è dichiarata prima dell'incarico, senza costi di pubblicazione a carico del proprietario.",
      aboutMethod:
        "Il prezzo si costruisce sui dati reali di compravendita, non sugli annunci: se una richiesta è fuori mercato lo diciamo subito, anche se significa tempi più lunghi per chiudere l'incarico.",
      aboutTeam:
        "In agenzia siamo in pochi e ci dividiamo le zone: chi ti accompagna in visita conosce palazzi, spese condominiali e tempi di vendita reali.",
      bioTemplate: "{role}: segue valutazione, visite e trattativa fino al rogito, con aggiornamenti scritti a ogni passaggio.",
      statsTitle: "Dati delle nostre vendite",
      servicesTitle: "Vendere e comprare, senza perdite di tempo",
      servicesIntro: "Valutazione, promozione, visite e trattativa: ogni fase ha un referente e un documento che la chiude.",
      servicesCtaTitle: "Stai valutando di vendere?",
      servicesCtaText: "Richiedi una stima gratuita: sopralluogo, confronto con i dati di zona e report scritto, senza impegno.{area}",
      contactTitle: "Richiedi una valutazione",
      contactNote: "La valutazione richiede un sopralluogo di circa un'ora. Se stai cercando casa, dicci zona e budget: ti avvisiamo per primo sugli immobili in arrivo.",
    },
    services: [
      { icon: "scale", title: "Valutazione gratuita", text: "Stima basata su dati reali di compravendita, non su annunci." },
      { icon: "briefcase", title: "Vendita", text: "Home staging, foto professionali e piano di promozione." },
      { icon: "users", title: "Acquisto", text: "Selezione degli immobili coerenti con budget e bisogni." },
      { icon: "lock", title: "Locazioni", text: "Affitti con verifiche su garanzie e contratti regolari." },
      { icon: "shield", title: "Due diligence", text: "Verifiche catastali, urbanistiche e ipotecarie." },
      { icon: "globe", title: "Investimenti", text: "Rendimenti attesi, gestione e rivendita." },
    ],
    features: [
      { icon: "activity", title: "Dati reali di mercato", text: "Prezzi effettivi, non richieste." },
      { icon: "calendar", title: "Visite concentrate", text: "Raggruppiamo gli appuntamenti in una giornata." },
      { icon: "scale", title: "Provvigioni dichiarate", text: "Nessun costo aggiuntivo a sorpresa." },
    ],
    process: [
      { title: "Valutazione", text: "Sopralluogo e stima della fascia di prezzo realistica." },
      { title: "Preparazione", text: "Home staging, foto e documentazione." },
      { title: "Promozione", text: "Portali, contatti diretti e passaparola qualificato." },
      { title: "Trattativa", text: "Gestione delle offerte e supporto fino al rogito." },
    ],
    faq: [
      { question: "La valutazione è gratuita?", answer: "Sì, sopralluogo e stima non hanno costo e non impegnano a mandare avanti l'incarico." },
      { question: "Quanto costa vendere?", answer: "Provvigione percentuale dichiarata all'inizio, senza costi di pubblicazione a tuo carico." },
      { question: "Quanto tempo serve per vendere?", answer: "Con un prezzo corretto, nella nostra zona la media è di 3-4 mesi dal primo appuntamento." },
      { question: "Vi occupate anche di affitti?", answer: "Sì, con contratti regolari e verifica delle garanzie del conduttore." },
    ],
    testimonials: [
      { quote: "Valutazione realistica: venduta in dieci settimane al prezzo indicato all'inizio.", author: "Cristina P.", role: "Proprietaria" },
      { quote: "Ci hanno evitato almeno sei visite inutili, capendo subito cosa cercavamo.", author: "Marco e Sara", role: "Acquirenti" },
      { quote: "Gestione impeccabile della documentazione fino al rogito.", author: "Avv. Bergonzi", role: "Parte venditrice" },
    ],
    stats: [
      { value: "310", label: "Compravendite concluse" },
      { value: "72 gg", label: "Tempo medio di vendita" },
      { value: "1,8%", label: "Scostamento medio dal prezzo richiesto" },
    ],
    plans: [
      { name: "Valutazione", price: "gratuita", period: "", description: "Stima della fascia di prezzo con dati di mercato.", features: ["Sopralluogo", "Report scritto", "Confronto annunci"] },
      { name: "Incarico vendita", price: "provvigione", period: "a vendita", description: "Promozione completa fino al rogito.", features: ["Home staging e foto", "Portali premium", "Gestione trattativa"], featured: true },
      { name: "Ricerca su misura", price: "su richiesta", period: "", description: "Per chi cerca un immobile specifico.", features: ["Selezione riservata", "Prime informazioni", "Visite dedicate"] },
    ],
    teamRoles: ["Titolare", "Agente senior", "Back office"],
    galleryCaptions: ["Soggiorno", "Cucina", "Camera padronale", "Balcone", "Vista", "Esterno"],
    pages: [
      { path: "/immobili", title: "Immobili", kind: "page" },
      { path: "/valutazione", title: "Valutazione", kind: "page" },
      { path: "/contatti", title: "Contatti", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    navLabels: { services: "Immobili", about: "Valutazione" },
  },

  education: {
    ...GENERIC,
    label: "scuola o formazione",
    keywords: ["scuola", "corso", "formazione", "accademia", "insegnante", "ripetizioni", "master", "educazione"],
    preset: "organic",
    paletteHarmony: "triadic",
    primaryL: 0.56,
    heading: "Imparare bene richiede tempo, metodo e gruppi giusti",
    tagline: "Classi piccole, programma dichiarato, verifica dei progressi.",
    intro:
      "Prima di iscriverti sai cosa imparerai, quanto tempo servirà e come verifichiamo insieme che stia funzionando.",
    voice: {
      ctaLabel: "Prenota il colloquio",
      ctaTitle: "Prima il colloquio, poi il percorso",
      ctaText: "Fissiamo un colloquio conoscitivo: verifichiamo il livello di partenza e indichiamo moduli e tempi realistici.{area}",
      areaClause: "Le aule sono a {city}.",
      pricingNote: "Le quote comprendono materiali e attestato. I percorsi si possono pagare a moduli.",
      aboutMethod:
        "Prima di iscriverti sai cosa si fa lezione per lezione, quanto tempo servirà e come verifichiamo i progressi: test intermedi, registrazioni delle lezioni e un incontro di recupero per modulo.",
      aboutTeam:
        "Le classi sono di massimo dieci persone e i docenti restano gli stessi dall'inizio alla fine del percorso: nessun cambio a metà corso.",
      bioTemplate: "{role}: tiene le lezioni, prepara i materiali e segue i progressi degli allievi con verifiche periodiche.",
      statsTitle: "I nostri numeri",
      servicesTitle: "Come sono fatti i percorsi",
      servicesIntro: "Moduli indipendenti e componibili, con classi ridotte e verifiche intermedie: sai sempre a che punto sei.",
      servicesCtaTitle: "Non sai da quale modulo partire?",
      servicesCtaText: "Facciamo un colloquio di orientamento: ti diciamo cosa serve davvero e cosa puoi saltare.{area}",
      contactTitle: "Prenota un colloquio",
      contactNote: "Il colloquio di orientamento è gratuito e serve a collocarti nel modulo giusto. Le lezioni si tengono in aula e online, con registrazioni disponibili.",
    },
    services: [
      { icon: "users", title: "Classi ridotte", text: "Massimo 10 partecipanti per seguire tutti davvero." },
      { icon: "calendar", title: "Percorsi modulari", text: "Moduli indipendenti, componibili secondo gli obiettivi." },
      { icon: "award", title: "Attestato finale", text: "Certificazione con verifica delle competenze." },
      { icon: "message", title: "Tutor dedicato", text: "Un riferimento per dubbi e recuperi." },
      { icon: "globe", title: "Anche online", text: "Aule virtuali dal vivo, con registrazioni disponibili." },
      { icon: "heart", title: "Ripetizioni mirate", text: "Incontri individuali sulle parti più difficili." },
    ],
    features: [
      { icon: "check", title: "Programma dichiarato", text: "Sai cosa si fa in ogni lezione." },
      { icon: "users", title: "Gruppi piccoli", text: "Massimo 10 persone, sempre." },
      { icon: "activity", title: "Verifiche intermedie", text: "Test di progresso ogni mese." },
    ],
    process: [
      { title: "Colloquio", text: "Capiamo livello di partenza e obiettivo." },
      { title: "Percorso", text: "Ti indichiamo moduli e tempi realistici." },
      { title: "Lezioni", text: "Gruppi piccoli, esercizi e materiali." },
      { title: "Verifica", text: "Test intermedi e attestato finale." },
    ],
    faq: [
      { question: "Serve una base per iniziare?", answer: "No, i percorsi base partono da zero. Se hai già esperienza facciamo un colloquio per collocarti nel modulo giusto." },
      { question: "Posso recuperare una lezione persa?", answer: "Sì: le lezioni sono registrate e prevediamo un incontro di recupero per ciascun modulo." },
      { question: "Quante persone ci sono per classe?", answer: "Massimo 10. È il limite che ci consente di seguire ognuno durante gli esercizi." },
      { question: "Rilasciate un attestato?", answer: "Sì, con verifica delle competenze al termine del percorso." },
    ],
    testimonials: [
      { quote: "Classi piccole e tutor sempre disponibile: ho finito il percorso senza accumulare lacune.", author: "Federico A.", role: "Corsista" },
      { quote: "Finalmente un programma chiaro, con date e argomenti decisi in anticipo.", author: "Beatrice L.", role: "Corsista" },
      { quote: "Mio figlio ha ripreso fiducia in matematica in tre mesi.", author: "Antonella R.", role: "Genitore" },
    ],
    stats: [
      { value: "10", label: "Massimo per classe" },
      { value: "1.400", label: "Allievi formati" },
      { value: "92%", label: "Completano il percorso" },
    ],
    plans: [
      { name: "Modulo singolo", price: "da 240 €", period: "", description: "Un modulo specifico del percorso.", features: ["12 ore di lezione", "Materiali inclusi", "Attestato di modulo"] },
      { name: "Percorso completo", price: "da 890 €", period: "", description: "Tutti i moduli, con verifiche intermedie.", features: ["60 ore di lezione", "Tutor dedicato", "Attestato finale"], featured: true },
      { name: "Lezione individuale", price: "38 €", period: "all'ora", description: "Ripetizioni mirate su richiesta.", features: ["Programma su misura", "Orari flessibili", "Materiali dedicati"] },
    ],
    teamRoles: ["Direttore didattico", "Docente senior", "Tutor"],
    galleryCaptions: ["Aula", "Laboratorio", "Lezione online", "Materiali didattici"],
    pages: [
      { path: "/corsi", title: "Corsi", kind: "page" },
      { path: "/docenti", title: "Docenti", kind: "page" },
      { path: "/iscrizioni", title: "Iscrizioni", kind: "page" },
      { path: "/privacy", title: "Privacy", kind: "legal" },
      { path: "/cookie", title: "Cookie", kind: "legal" },
    ],
    navLabels: { services: "Corsi", about: "Docenti" },
  },
};

/**
 * Etichette dei settori per l'interfaccia.
 *
 * I profili restano in minuscolo perché finiscono anche nei testi generati
 * ("… a Bologna — studio di architettura"): la tendina invece deve leggersi
 * come un elenco di mestieri, non come un codice interno.
 */
export const SECTOR_LABELS: Record<Sector, string> = {
  restaurant: "Ristorazione",
  legal: "Studio legale",
  medical: "Studi medici e salute",
  fitness: "Palestre e fitness",
  saas: "Software e SaaS",
  ecommerce: "Negozio online",
  agency: "Agenzia e comunicazione",
  artisan: "Impresa artigiana",
  architecture: "Studio di architettura",
  realestate: "Agenzia immobiliare",
  education: "Scuola e formazione",
  generic: "Altro / generico",
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * La parola chiave è presente nel testo?
 *
 * In italiano il plurale sposta la vocale finale — "ristrutturazione" diventa
 * "ristrutturazioni" — e un confronto letterale perderebbe proprio i termini
 * più usati ("impresa di ristrutturazioni"). Sulle parole lunghe confrontiamo
 * la radice, ma solo se seguita da una desinenza di plurale: così
 * "ristrutturazione" riconosce "ristrutturazioni" mentre "artigiano" non
 * combacia con "artigianali".
 */
function matchesKeyword(text: string, keyword: string): boolean {
  if (text.includes(keyword)) return true;
  if (keyword.length < 9) return false;
  const stem = keyword.replace(/[aeio]$/, "");
  if (stem.length < 8) return false;
  return new RegExp(`${escapeRegex(stem)}[ie](?![a-zà-ù])`).test(text);
}

/** Riconosce il settore da un prompt in italiano, pesando la specificità delle parole. */
export function detectSector(prompt: string): { sector: Sector; matched: string[] } {
  const text = prompt.toLowerCase();
  let best: { sector: Sector; matched: string[]; score: number } = { sector: "generic", matched: [], score: 0 };

  for (const [sector, profile] of Object.entries(SECTOR_PROFILES) as [Sector, SectorProfile][]) {
    const matched = profile.keywords.filter((keyword) => matchesKeyword(text, keyword));
    // Le parole più lunghe sono più specifiche: "immobiliare" batte "agenzia",
    // "studio dentistico" batte "studio".
    const score = matched.reduce((total, keyword) => total + keyword.length, 0);
    if (score > best.score) best = { sector, matched, score };
  }

  return { sector: best.sector, matched: best.matched };
}
