"use client";

import { getPasswordStrength } from "../../lib/validation";

const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-600"];

const PasswordStrengthMeter = ({ password }) => {
  const { score, label, suggestions } = getPasswordStrength(password);
  const width = ((score + 1) / 5) * 100;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Password strength</span>
        <span className="font-semibold">{label}</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full transition-all ${strengthColors[score]}`}
          style={{ width: `${width}%` }}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 text-xs text-gray-500" aria-live="polite">
          {suggestions.slice(0, 2).map((suggestion) => (
            <div key={suggestion}>• {suggestion}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
