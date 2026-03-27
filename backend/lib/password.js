import bcrypt from "bcrypt";

const SALT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);

export const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

export const getPasswordStrength = (password = "") => {
  const rules = [
    { test: password.length >= 8, hint: "Use at least 8 characters" },
    { test: /[A-Z]/.test(password), hint: "Add an uppercase letter" },
    { test: /[a-z]/.test(password), hint: "Add a lowercase letter" },
    { test: /\d/.test(password), hint: "Add a number" },
    { test: /[^A-Za-z0-9]/.test(password), hint: "Add a symbol" },
  ];

  const passed = rules.filter((rule) => rule.test).length;
  const score = Math.min(4, Math.max(0, passed - 1));
  const hints = rules.filter((rule) => !rule.test).map((rule) => rule.hint);
  return { score, hints };
};

export const validatePassword = (password = "") => {
  const { score, hints } = getPasswordStrength(password);
  const ok = score >= 3;
  return { ok, score, hints };
};
