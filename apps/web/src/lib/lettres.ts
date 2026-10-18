// Montant en toutes lettres (reçus : « Arrêté le présent reçu à la somme de … francs CFA »).
// Orthographe traditionnelle : vingt et un, quatre-vingts, deux cents, mille (invariable).

const UNITES = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

function moinsDeCent(n: number): string {
  if (n < 20) return UNITES[n];
  if (n < 70) {
    const d = Math.floor(n / 10), u = n % 10;
    return DIZAINES[d] + (u === 0 ? "" : u === 1 ? " et un" : `-${UNITES[u]}`);
  }
  if (n < 80) return n === 71 ? "soixante et onze" : `soixante-${UNITES[n - 60]}`;
  if (n === 80) return "quatre-vingts";
  return `quatre-vingt-${UNITES[n - 80]}`;
}

function moinsDeMille(n: number): string {
  const c = Math.floor(n / 100), r = n % 100;
  if (c === 0) return moinsDeCent(r);
  const cent = c === 1 ? "cent" : `${UNITES[c]} cent${r === 0 ? "s" : ""}`;
  return r === 0 ? cent : `${cent} ${moinsDeCent(r)}`;
}

/** 125 000 → « cent vingt-cinq mille » (entiers positifs jusqu'à 999 999 999 999). */
export function enLettres(montant: number): string {
  let n = Math.floor(Math.abs(montant));
  if (n === 0) return "zéro";
  const parties: string[] = [];
  const groupes: [number, string, string][] = [
    [1_000_000_000, "milliard", "milliards"],
    [1_000_000, "million", "millions"],
  ];
  for (const [valeur, sing, plur] of groupes) {
    const q = Math.floor(n / valeur);
    if (q > 0) {
      parties.push(`${moinsDeMille(q)} ${q > 1 ? plur : sing}`);
      n %= valeur;
    }
  }
  const milliers = Math.floor(n / 1000);
  if (milliers > 0) {
    // « mille » est invariable et ne prend pas « un » ; « quatre-vingt mille », « deux cent mille ».
    const m = milliers === 1 ? "" : moinsDeMille(milliers).replace(/(vingt|cent)s$/, "$1") + " ";
    parties.push(`${m}mille`);
    n %= 1000;
  }
  if (n > 0) parties.push(moinsDeMille(n));
  return parties.join(" ");
}
