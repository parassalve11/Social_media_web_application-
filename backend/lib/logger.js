const formatPayload = (payload) => {
  try {
    return JSON.stringify(payload);
  } catch (error) {
    return String(payload);
  }
};

export const logInfo = (event, payload = {}) => {
  console.log(formatPayload({ level: "info", event, ...payload }));
};

export const logWarn = (event, payload = {}) => {
  console.warn(formatPayload({ level: "warn", event, ...payload }));
};

export const logError = (event, payload = {}) => {
  console.error(formatPayload({ level: "error", event, ...payload }));
};
