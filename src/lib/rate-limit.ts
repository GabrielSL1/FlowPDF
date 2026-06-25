/**
 * Rate limiter simples em memória, por processo. Mitiga abuso básico (ex: um
 * script automatizado disparando centenas de uploads por segundo com a mesma
 * conta), mas NÃO é uma solução distribuída — cada instância serverless tem
 * sua própria contagem, e a contagem zera a cada cold start. Para proteção
 * robusta em produção, considere Upstash Redis (ratelimit) ou o Firewall /
 * Rate Limiting nativo da Vercel, que funcionam de forma distribuída entre
 * instâncias.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Evita crescimento ilimitado do Map em processos de longa duração.
function cleanup(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/**
 * @returns `null` se a requisição está dentro do limite, ou o número de
 * segundos que o chamador deve esperar antes de tentar novamente.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): number | null {
  const now = Date.now();
  cleanup(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > maxRequests) {
    return Math.ceil((bucket.resetAt - now) / 1000);
  }
  return null;
}
