import json
import os
import base64
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    """Анализирует чертёж металлоконструкции через Gemini Vision и возвращает список материалов."""

    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    body = json.loads(event.get("body") or "{}")
    image_data = body.get("image_data")
    mime_type = body.get("mime_type", "image/jpeg")

    if not image_data:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Изображение не передано"}, ensure_ascii=False),
        }

    prompt = """Ты — эксперт по металлоконструкциям. Проанализируй этот строительный чертёж.

Определи и перечисли все металлические материалы, необходимые для изготовления конструкции:
- Тип проката (труба профильная, труба круглая, уголок, швеллер, двутавр, арматура, полоса, лист и т.д.)
- Размеры (мм)
- Количество (штук или погонных метров)
- Общая длина или площадь где применимо

Если на чертеже есть размеры — используй их. Если нет — дай приблизительную оценку.
Также укажи:
- Ориентировочный общий вес конструкции (кг)
- Сварочные швы (погонные метры)
- Крепёжные элементы (болты, гайки) если видны

Ответь строго в формате JSON:
{
  "materials": [
    {
      "type": "название типа проката",
      "size": "размеры в мм",
      "quantity": число,
      "unit": "шт или м.п.",
      "total_length_m": число или null,
      "weight_kg": число или null,
      "comment": "примечание или null"
    }
  ],
  "total_weight_kg": число или null,
  "weld_length_m": число или null,
  "fasteners": "описание крепежа или null",
  "notes": "общие примечания по чертежу"
}

Если чертёж нечёткий или информации недостаточно — всё равно дай оценку на основе видимых элементов."""

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_data,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
        },
    }

    api_key = os.environ.get("GEMINI_API_KEY", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    text = result["candidates"][0]["content"]["parts"][0]["text"]

    # Извлекаем JSON из ответа
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        analysis = json.loads(text[start:end])
    else:
        analysis = {"notes": text, "materials": []}

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps(analysis, ensure_ascii=False),
    }