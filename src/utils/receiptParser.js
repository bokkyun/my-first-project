import {
  parseImageWithModelFallback,
  stripModelJsonFences,
  VISION_MODEL_PRIORITY,
} from './openRouterVision';

export { VISION_MODEL_PRIORITY as RECEIPT_MODEL_PRIORITY };

const RECEIPT_PROMPT = `이 이미지는 영수증, 카드 승인 문자, 또는 쇼핑몰 주문내역입니다.
다음 정보를 추출해서 반드시 JSON 형식으로만 응답하세요 (마크다운 불필요):

{
  "date": "YYYY-MM-DD",
  "amount": 숫자 (원화, 숫자만),
  "merchant": "가맹점명 또는 쇼핑몰명",
  "items": [
    {"name": "품목명", "price": 숫자, "qty": 수량}
  ],
  "category": "식비|쇼핑|교통|의료|문화|기타",
  "source_type": "receipt|sms|slip|screenshot",
  "confidence": "high|medium|low"
}

날짜가 없으면 오늘 날짜, 품목이 없으면 빈 배열. 금액은 총액 기준.`;

/** @param {File} file */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * OpenRouter 비전 API로 영수증 이미지 분석 (모델 우선순위 fallback)
 * @param {string} base64Image
 * @param {string} mimeType
 */
export async function parseReceiptImage(base64Image, mimeType = 'image/jpeg') {
  return parseImageWithModelFallback({
    base64Image,
    mimeType,
    prompt: RECEIPT_PROMPT,
    maxTokens: 1000,
    logTag: 'receiptParser',
    parseJson: (text) => JSON.parse(stripModelJsonFences(text)),
  });
}
