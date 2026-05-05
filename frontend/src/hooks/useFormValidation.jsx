"use client";

import { useState } from "react";
import {
  validateEmail,
  validateName,
  validatePassword,
  validateUsername,
} from "../lib/validation";

const useFormValidation = (formType, initialValues) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Define validation rules for both forms
  const validationRules = {
    signup: {
      name: (value) => validateName(value),
      username: (value) => validateUsername(value),
      email: (value) => validateEmail(value),
      password: (value) => validatePassword(value),
    },
    signin: {
      identifier: (value) => {
        if (!value?.trim()) return "Email or username is required";
        return "";
      },
      password: (value) => {
        if (!value?.trim()) return "Password is required";
        return "";
      },
    },
  };

  // Select rules based on formType
  const rules = validationRules[formType] || {};

  // Function to validate a single field
  const validateField = (name, value) => {
    const validator = rules[name];
    if (!validator) return "";
    return validator(value, values);
  };

  // Function to validate all fields
  const validateForm = () => {
    const newErrors = {};
    Object.keys(rules).forEach((key) => {
      const error = validateField(key, values[key] || "");
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    const touchedMap = Object.keys(rules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(touchedMap);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Validate the field on change
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Reset form
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    handleChange,
    validateForm,
    resetForm,
    setValues,
    touched,
    handleBlur,
  };
};

export default useFormValidation;
