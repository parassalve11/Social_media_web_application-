import response from "../lib/responeHandler.js";
import { rateLimit } from "../lib/rateLimit.js";

const ALLOWED_LENGTHS = new Set(["short", "medium", "long"]);
const MAX_RECENT_MESSAGES = 8;

const cleanText = (value, maxLength) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "";
  return text.slice(0, maxLength);
};

const normalizeLength = (value) =>
  ALLOWED_LENGTHS.has(String(value || "").toLowerCase())
    ? String(value).toLowerCase()
    : "medium";

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  return String(value || "").toLowerCase() === "true";
};

const getAiService = (req) => req.app?.locals?.aiService;

const ensureAiService = (req) => {
  const aiService = getAiService(req);
  const configured =
    typeof aiService?.isConfigured === "function" ? aiService.isConfigured() : Boolean(aiService);

  if (!aiService || !configured) {
    const error = new Error("AI drafting is not configured on the server");
    error.statusCode = 503;
    throw error;
  }

  return aiService;
};

const enforceRateLimit = async ({ key, limit, windowSeconds, res }) => {
  const result = await rateLimit({ key, limit, windowSeconds });
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));

  if (!result.allowed) {
    const error = new Error("AI draft limit reached. Please try again a little later.");
    error.statusCode = 429;
    throw error;
  }
};

const normalizeRecentMessages = (recentMessages) => {
  if (!Array.isArray(recentMessages)) return [];

  return recentMessages
    .slice(-MAX_RECENT_MESSAGES)
    .map((item) => ({
      role: cleanText(item?.role, 40) || "participant",
      content: cleanText(item?.content, 320),
    }))
    .filter((item) => item.content);
};

export const generatePostDraft = async (req, res) => {
  try {
    const aiService = ensureAiService(req);
    await enforceRateLimit({
      key: `ai:posts:${req.user._id}`,
      limit: 20,
      windowSeconds: 15 * 60,
      res,
    });

    const prompt = cleanText(req.body?.prompt || req.body?.topic, 500);
    const existingDraft = cleanText(req.body?.existingDraft, 1200);

    if (!prompt && !existingDraft) {
      return response(res, 400, "A prompt or existing draft is required");
    }

    const draft = await aiService.generatePostDraft({
      authorName: cleanText(req.user?.name, 80),
      prompt: prompt || "Turn the existing draft into a polished social media post.",
      tone: cleanText(req.body?.tone, 32) || "professional",
      length: normalizeLength(req.body?.length),
      includeHashtags: toBoolean(req.body?.includeHashtags),
      existingDraft,
    });

    return response(res, 200, "AI post draft generated", { draft });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return response(
      res,
      statusCode,
      statusCode >= 500 ? "Unable to generate an AI post draft right now" : error.message
    );
  }
};

export const generateMessageDraft = async (req, res) => {
  try {
    const aiService = ensureAiService(req);
    await enforceRateLimit({
      key: `ai:messages:${req.user._id}`,
      limit: 40,
      windowSeconds: 15 * 60,
      res,
    });

    const prompt = cleanText(req.body?.prompt || req.body?.goal, 400);
    const existingDraft = cleanText(req.body?.existingDraft, 800);

    if (!prompt && !existingDraft) {
      return response(res, 400, "A prompt or existing message draft is required");
    }

    const draft = await aiService.generateMessageDraft({
      prompt: prompt || "Turn the existing draft into a polished direct message reply.",
      tone: cleanText(req.body?.tone, 32) || "friendly",
      length: normalizeLength(req.body?.length),
      recipientName: cleanText(req.body?.recipientName, 80),
      relationshipContext: cleanText(req.body?.relationshipContext, 240),
      existingDraft,
      recentMessages: normalizeRecentMessages(req.body?.recentMessages),
    });

    return response(res, 200, "AI message draft generated", { draft });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return response(
      res,
      statusCode,
      statusCode >= 500 ? "Unable to generate an AI message draft right now" : error.message
    );
  }
};
