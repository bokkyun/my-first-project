function getOpenRouterApiKey() {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  return typeof key === 'string' ? key.trim() : key;
}

const MODEL_OVERRIDE = import.meta.env.VITE_OPENROUTER_RECEIPT_MODEL
  || import.meta.env.VITE_OPENROUTER_VISION_MODEL;

/** 영수증·체결내역 등 이미지 OCR 공통 모델 우선순위 */
export const VISION_MODEL_PRIORITY = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'nex-agi/nex-n2-pro:free',
  'openrouter/free',
];

export function assertOpenRouterKey() {
  if (!getOpenRouterApiKey()) {
    if (import.meta.env.PROD) {
      throw new Error(
        'VITE_OPENROUTER_API_KEY가 배포 환경에 없습니다. GitHub → my-first-project → Settings → Secrets → Actions 에 등록한 뒤 다시 배포해 주세요.',
      );
    }
    throw new Error(
      'VITE_OPENROUTER_API_KEY가 .env에 없습니다. lecture1/my-first-project/.env 를 확인하고 dev 서버(Ctrl+C 후 npm run dev)를 재시작해 주세요.',
    );
  }
}

export function stripModelJsonFences(text) {
  return text.replace(/```json|```/g, '').trim();
}

/**
 * @param {string} model
 * @param {string} base64Image
 * @param {string} mimeType
 * @param {string} prompt
 * @param {number} [maxTokens]
 */
export async function requestVisionParse(model, base64Image, mimeType, prompt, maxTokens = 1000) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getOpenRouterApiKey()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://moneycalai.com',
      'X-Title': 'MoneyCal AI',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
          { type: 'text', text: prompt },
        ],
      }],
      max_tokens: maxTokens,
      temperature: 0,
    }),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    let detail = rawBody.slice(0, 160);
    try {
      const errJson = JSON.parse(rawBody);
      detail = errJson?.error?.message || errJson?.message || detail;
    } catch {
      /* keep raw slice */
    }
    throw new Error(`HTTP ${response.status} — ${detail}`);
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    throw new Error('응답 JSON 파싱 실패');
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('모델 응답이 비어 있습니다.');
  return text;
}

/**
 * @param {object} opts
 * @param {string} opts.base64Image
 * @param {string} opts.mimeType
 * @param {string} opts.prompt
 * @param {number} [opts.maxTokens]
 * @param {string} opts.logTag
 * @param {(text: string) => unknown} opts.parseJson
 */
export async function parseImageWithModelFallback({
  base64Image,
  mimeType = 'image/jpeg',
  prompt,
  maxTokens = 1000,
  logTag = 'vision',
  parseJson,
}) {
  assertOpenRouterKey();

  const models = MODEL_OVERRIDE ? [MODEL_OVERRIDE] : VISION_MODEL_PRIORITY;
  const failures = [];

  for (const model of models) {
    try {
      const text = await requestVisionParse(model, base64Image, mimeType, prompt, maxTokens);
      const parsed = parseJson(text);
      if (import.meta.env.DEV) {
        console.info(`[${logTag}] 성공 모델: ${model}`);
      }
      if (Array.isArray(parsed)) {
        return { trades: parsed, _model: model };
      }
      if (parsed && typeof parsed === 'object') {
        return { ...parsed, _model: model };
      }
      return { data: parsed, _model: model };
    } catch (err) {
      failures.push(`${model}: ${err.message}`);
      if (import.meta.env.DEV) {
        console.warn(`[${logTag}] fallback — ${model}:`, err.message);
      }
    }
  }

  throw new Error(
    `이미지 분석 실패 (시도 ${models.length}개 모델):\n${failures.join('\n')}`,
  );
}
