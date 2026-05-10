/**
 * supabase.functions.invoke 실패 시 본문(JSON/HTML)을 붙여 디버깅·안내에 쓰입니다.
 * @param {unknown} error - Supabase FunctionsHttpError 등
 * @returns {Promise<string>}
 */
export async function readSupabaseFunctionErrorMessage(error) {
  const base = error && typeof error === 'object' && 'message' in error && error.message
    ? String(error.message)
    : String(error ?? 'Unknown error');

  const ctx = error && typeof error === 'object' ? error.context : null;
  if (!ctx) return base;

  try {
    if (typeof ctx.json === 'function') {
      const body = await ctx.json();
      if (body && typeof body === 'object') {
        const err = body.error ?? body.message ?? body.msg;
        const hint = body.hint ?? body.details;
        if (err != null && hint != null) return `${base} — ${String(err)}. ${String(hint)}`;
        if (err != null) return `${base} — ${String(err)}`;
      }
      return `${base} — ${JSON.stringify(body).slice(0, 400)}`;
    }
  } catch {
    /* 본문이 JSON이 아닐 수 있음 */
  }

  try {
    if (typeof ctx.text === 'function') {
      const text = await ctx.text();
      if (text) return `${base} — ${text.slice(0, 400)}`;
    }
  } catch {
    /* ignore */
  }

  return base;
}
