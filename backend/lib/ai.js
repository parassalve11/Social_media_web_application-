const DEFAULT_TIMEOUT_MS = 20000;

const POST_LENGTH_GUIDE = {
  short: "40 to 90 words",
  medium: "90 to 180 words",
  long: "180 to 280 words",
};

const MESSAGE_LENGTH_GUIDE = {
  short: "1 to 2 sentences",
  medium: "2 to 4 sentences",
  long: "4 to 6 sentences",
};

const truncate = (value, max) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
};

const collapseWhitespace = (value) =>
  value
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const unwrapQuotedText = (value) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
};

const normalizeDraft = (value) => {
  const text = typeof value === "string" ? value : "";
  return unwrapQuotedText(collapseWhitespace(text));
};

const normalizeContent = (content) => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text") return part.text || "";
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
};

const buildPostPrompt = ({
  authorName,
  prompt,
  tone,
  length,
  includeHashtags,
  existingDraft,
}) => [
  {
    role: "system",
    content:
      "You write polished, human-sounding social media post drafts for a modern consumer app. Return only the draft text. Do not add labels, bullet points, explanations, or quotation marks around the answer.",
  },
  {
    role: "user",
    content: [
      `Write a ${tone} social media post draft.`,
      authorName ? `Author display name: ${authorName}.` : "",
      `Target length: ${POST_LENGTH_GUIDE[length] || POST_LENGTH_GUIDE.medium}.`,
      includeHashtags
        ? "End with 2 to 4 relevant hashtags."
        : "Do not add hashtags unless the request explicitly needs them.",
      `Prompt: ${prompt}.`,
      existingDraft
        ? `Use this existing draft as source material and improve it without sounding robotic:\n${existingDraft}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  },
];

const buildRecentMessagesText = (recentMessages = []) => {
  if (!Array.isArray(recentMessages) || recentMessages.length === 0) {
    return "";
  }

  return recentMessages
    .slice(-8)
    .map((item) => {
      const role = truncate(String(item?.role || "participant"), 30);
      const content = truncate(String(item?.content || ""), 280);
      return content ? `${role}: ${content}` : "";
    })
    .filter(Boolean)
    .join("\n");
};

const buildMessagePrompt = ({
  prompt,
  tone,
  length,
  recipientName,
  relationshipContext,
  existingDraft,
  recentMessages,
}) => {
  const conversationContext = buildRecentMessagesText(recentMessages);

  return [
    {
      role: "system",
      content:
        "You write polished, natural direct message drafts for a social messaging app. Return only the message text. Keep it human, concise, and ready to send. Do not add explanations or quotation marks around the answer.",
    },
    {
      role: "user",
      content: [
        `Draft a ${tone} direct message.`,
        `Target length: ${MESSAGE_LENGTH_GUIDE[length] || MESSAGE_LENGTH_GUIDE.medium}.`,
        recipientName ? `Recipient: ${recipientName}.` : "",
        relationshipContext ? `Relationship/context: ${relationshipContext}.` : "",
        `Goal: ${prompt}.`,
        existingDraft
          ? `Existing unsent draft to improve:\n${existingDraft}`
          : "",
        conversationContext
          ? `Recent conversation context:\n${conversationContext}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
};

export const createAiService = (config = {}) => {
  const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
  const model = config.model ?? process.env.OPENAI_MODEL;
  const rawBaseUrl =
    config.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1";
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const httpReferer =
    config.httpReferer ?? process.env.OPENROUTER_HTTP_REFERER ?? process.env.CLIENT_URL;
  const appTitle = config.appTitle ?? process.env.OPENROUTER_APP_TITLE ?? "Social Media App";
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const isConfigured = () => Boolean(apiKey && model && baseUrl);

  const requestCompletion = async ({ messages, maxTokens, temperature }) => {
    if (!isConfigured()) {
      const error = new Error("AI service is not configured");
      error.statusCode = 503;
      throw error;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(httpReferer ? { "HTTP-Referer": httpReferer } : {}),
          ...(appTitle ? { "X-Title": appTitle } : {}),
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const providerMessage =
          payload?.error?.message ||
          payload?.message ||
          "The AI provider request failed";
        const error = new Error(providerMessage);
        error.statusCode = response.status >= 400 && response.status < 500 ? response.status : 502;
        throw error;
      }

      const text = normalizeContent(payload?.choices?.[0]?.message?.content);
      return normalizeDraft(text);
    } catch (error) {
      if (error.name === "AbortError") {
        const timeoutError = new Error("The AI request timed out");
        timeoutError.statusCode = 504;
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    isConfigured,
    async generatePostDraft(input) {
      const draft = await requestCompletion({
        messages: buildPostPrompt(input),
        temperature: 0.8,
        maxTokens: 320,
      });

      if (!draft) {
        const error = new Error("The AI provider returned an empty post draft");
        error.statusCode = 502;
        throw error;
      }

      return draft;
    },
    async generateMessageDraft(input) {
      const draft = await requestCompletion({
        messages: buildMessagePrompt(input),
        temperature: 0.7,
        maxTokens: 220,
      });

      if (!draft) {
        const error = new Error("The AI provider returned an empty message draft");
        error.statusCode = 502;
        throw error;
      }

      return draft;
    },
  };
};
