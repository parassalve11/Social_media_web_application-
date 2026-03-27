const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_]+$/;

export const validateEmail = (email) => {
  if (!email?.trim()) return "Email is required";
  if (!emailRegex.test(email)) return "Enter a valid email address";
  return "";
};

export const validateUsername = (username) => {
  if (!username?.trim()) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters";
  if (!usernameRegex.test(username))
    return "Username can only contain letters, numbers, and underscores";
  return "";
};

export const validateName = (name) => {
  if (!name?.trim()) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return "";
};

export const getPasswordStrength = (password = "") => {
  const rules = [
    { test: password.length >= 8, label: "Use at least 8 characters" },
    { test: /[A-Z]/.test(password), label: "Add an uppercase letter" },
    { test: /[a-z]/.test(password), label: "Add a lowercase letter" },
    { test: /\d/.test(password), label: "Add a number" },
    { test: /[^A-Za-z0-9]/.test(password), label: "Add a symbol" },
  ];

  const passed = rules.filter((rule) => rule.test).length;
  const score = Math.min(4, Math.max(0, passed - 1));
  const suggestions = rules.filter((rule) => !rule.test).map((rule) => rule.label);
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Excellent"];
  return { score, label: labels[score], suggestions };
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  const { score, suggestions } = getPasswordStrength(password);
  if (score < 3) {
    return suggestions[0] || "Password is too weak";
  }
  return "";
};
