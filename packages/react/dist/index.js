"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthForm: () => AuthForm,
  PicoBaseProvider: () => PicoBaseProvider,
  useAuth: () => useAuth,
  useClient: () => useClient,
  useCollection: () => useCollection,
  useRealtime: () => useRealtime
});
module.exports = __toCommonJS(index_exports);

// src/PicoBaseProvider.tsx
var import_react = require("react");
var import_client = require("@picobase_app/client");
var import_jsx_runtime = require("react/jsx-runtime");
var PicoBaseContext = (0, import_react.createContext)(null);
function PicoBaseProvider({ url, apiKey, options, children }) {
  const client = (0, import_react.useMemo)(
    () => (0, import_client.createClient)(url, apiKey, options),
    [url, apiKey]
  );
  const [user, setUser] = (0, import_react.useState)(() => client.auth.user);
  const [loading, setLoading] = (0, import_react.useState)(true);
  (0, import_react.useEffect)(() => {
    setUser(client.auth.user);
    if (client.auth.isValid) {
      client.auth.refreshToken().then((result) => setUser(result.record)).catch(() => {
        client.auth.signOut();
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    const unsubscribe = client.auth.onStateChange((event, record) => {
      setUser(record);
    });
    return unsubscribe;
  }, [client]);
  const value = (0, import_react.useMemo)(() => ({ client, user, loading }), [client, user, loading]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PicoBaseContext.Provider, { value, children });
}
function usePicoBaseContext() {
  const ctx = (0, import_react.useContext)(PicoBaseContext);
  if (!ctx) {
    throw new Error("usePicoBase* hooks must be used within a <PicoBaseProvider>");
  }
  return ctx;
}

// src/hooks.ts
var import_react2 = require("react");
function useAuth() {
  const { client, user, loading } = usePicoBaseContext();
  const signUp = (0, import_react2.useCallback)(
    (email, password, data) => client.auth.signUp({ email, password, ...data }),
    [client]
  );
  const signIn = (0, import_react2.useCallback)(
    (email, password) => client.auth.signIn({ email, password }),
    [client]
  );
  const signInWithOAuth = (0, import_react2.useCallback)(
    (provider) => client.auth.signInWithOAuth({ provider }),
    [client]
  );
  const signOut = (0, import_react2.useCallback)(() => client.auth.signOut(), [client]);
  const requestPasswordReset = (0, import_react2.useCallback)(
    (email) => client.auth.requestPasswordReset(email),
    [client]
  );
  return {
    user,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    requestPasswordReset
  };
}
function useClient() {
  const { client } = usePicoBaseContext();
  return client;
}
function useCollection(collectionName, options) {
  const { client } = usePicoBaseContext();
  const [items, setItems] = (0, import_react2.useState)([]);
  const [totalItems, setTotalItems] = (0, import_react2.useState)(0);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const [refreshKey, setRefreshKey] = (0, import_react2.useState)(0);
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const doFetch = (0, import_react2.useCallback)(() => {
    setLoading(true);
    setError(null);
    client.collection(collectionName).getList(page, perPage, {
      sort: options?.sort,
      filter: options?.filter,
      expand: options?.expand
    }).then((result) => {
      setItems(result.items);
      setTotalItems(result.totalItems);
    }).catch((err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
    }).finally(() => setLoading(false));
  }, [client, collectionName, page, perPage, options?.sort, options?.filter, options?.expand, refreshKey]);
  (0, import_react2.useState)(() => {
    doFetch();
  });
  const refresh = (0, import_react2.useCallback)(() => setRefreshKey((k) => k + 1), []);
  return { items, totalItems, loading, error, refresh };
}
function useRealtime(collectionName, options) {
  const { client } = usePicoBaseContext();
  const [items, setItems] = (0, import_react2.useState)([]);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const unsubRef = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    let cancelled = false;
    client.collection(collectionName).getFullList({
      sort: options?.sort,
      filter: options?.filter,
      expand: options?.expand
    }).then((records) => {
      if (!cancelled) {
        setItems(records);
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    });
    client.collection(collectionName).subscribe((event) => {
      if (cancelled) return;
      if (event.action === "create") {
        setItems((prev) => [...prev, event.record]);
      } else if (event.action === "update") {
        setItems(
          (prev) => prev.map(
            (item) => item.id === event.record.id ? event.record : item
          )
        );
      } else if (event.action === "delete") {
        setItems(
          (prev) => prev.filter(
            (item) => item.id !== event.record.id
          )
        );
      }
    }).then((unsub) => {
      unsubRef.current = unsub;
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    });
    return () => {
      cancelled = true;
      unsubRef.current?.();
    };
  }, [client, collectionName, options?.sort, options?.filter, options?.expand]);
  return { items, loading, error };
}

// src/AuthForm.tsx
var import_react3 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var DEFAULT_LABELS = {
  signIn: "Sign In",
  signUp: "Sign Up",
  email: "Email",
  password: "Password",
  confirmPassword: "Confirm Password",
  forgotPassword: "Forgot password?",
  switchToSignUp: "Don't have an account? Sign up",
  switchToSignIn: "Already have an account? Sign in",
  orContinueWith: "Or continue with",
  resetPassword: "Send Reset Link",
  backToSignIn: "Back to sign in",
  resetEmailSent: "If an account exists with that email, a password reset link has been sent."
};
var PROVIDER_NAMES = {
  google: "Google",
  github: "GitHub",
  discord: "Discord",
  microsoft: "Microsoft",
  apple: "Apple",
  twitter: "Twitter"
};
var styles = {
  container: {
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    textAlign: "center",
    marginBottom: "8px"
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "4px"
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box"
  },
  button: {
    width: "100%",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#ffffff",
    backgroundColor: "#4f46e5",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  oauthButton: {
    width: "100%",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#9ca3af",
    fontSize: "13px"
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#e5e7eb"
  },
  link: {
    fontSize: "14px",
    color: "#4f46e5",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline"
  },
  switchLink: {
    fontSize: "14px",
    color: "#6b7280",
    textAlign: "center"
  },
  error: {
    padding: "10px 12px",
    fontSize: "14px",
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px"
  },
  success: {
    padding: "10px 12px",
    fontSize: "14px",
    color: "#16a34a",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px"
  }
};
function AuthForm({
  mode = "signIn",
  providers = [],
  redirectTo,
  onSuccess,
  onError,
  className,
  showForgotPassword = true,
  labels: customLabels
}) {
  const { signIn, signUp, signInWithOAuth, requestPasswordReset } = useAuth();
  const labels = { ...DEFAULT_LABELS, ...customLabels };
  const [view, setView] = (0, import_react3.useState)(mode);
  const [email, setEmail] = (0, import_react3.useState)("");
  const [password, setPassword] = (0, import_react3.useState)("");
  const [confirmPassword, setConfirmPassword] = (0, import_react3.useState)("");
  const [error, setError] = (0, import_react3.useState)(null);
  const [submitting, setSubmitting] = (0, import_react3.useState)(false);
  const [resetSent, setResetSent] = (0, import_react3.useState)(false);
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (view === "forgotPassword") {
        await requestPasswordReset(email);
        setResetSent(true);
        return;
      }
      let result;
      if (view === "signUp") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        result = await signUp(email, password);
      } else {
        result = await signIn(email, password);
      }
      onSuccess?.(result.record);
      if (redirectTo && typeof window !== "undefined") {
        window.location.href = redirectTo;
      }
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error(String(err));
      setError(error2.message);
      onError?.(error2);
    } finally {
      setSubmitting(false);
    }
  }
  async function handleOAuth(provider) {
    setError(null);
    setSubmitting(true);
    try {
      const result = await signInWithOAuth(provider);
      onSuccess?.(result.record);
      if (redirectTo && typeof window !== "undefined") {
        window.location.href = redirectTo;
      }
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error(String(err));
      setError(error2.message);
      onError?.(error2);
    } finally {
      setSubmitting(false);
    }
  }
  function switchView(newView) {
    setView(newView);
    setError(null);
    setResetSent(false);
  }
  if (view === "forgotPassword") {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.container, className, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { onSubmit: handleSubmit, style: styles.form, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.title, children: labels.resetPassword }),
      error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.error, children: error }),
      resetSent && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.success, children: labels.resetEmailSent }),
      !resetSent && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { style: styles.label, children: labels.email }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              required: true,
              style: styles.input,
              placeholder: "you@example.com"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "submit",
            disabled: submitting,
            style: { ...styles.button, ...submitting ? styles.buttonDisabled : {} },
            children: submitting ? "Sending..." : labels.resetPassword
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.switchLink, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          type: "button",
          onClick: () => switchView("signIn"),
          style: styles.link,
          children: labels.backToSignIn
        }
      ) })
    ] }) });
  }
  const isSignUp = view === "signUp";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.container, className, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { onSubmit: handleSubmit, style: styles.form, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.title, children: isSignUp ? labels.signUp : labels.signIn }),
    error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.error, children: error }),
    providers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: providers.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          type: "button",
          onClick: () => handleOAuth(provider),
          disabled: submitting,
          style: styles.oauthButton,
          children: PROVIDER_NAMES[provider] || provider
        },
        provider
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.divider, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.dividerLine }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: labels.orContinueWith }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.dividerLine })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { style: styles.label, children: labels.email }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          type: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          required: true,
          style: styles.input,
          placeholder: "you@example.com"
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { style: styles.label, children: labels.password }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          type: "password",
          value: password,
          onChange: (e) => setPassword(e.target.value),
          required: true,
          minLength: 8,
          style: styles.input,
          placeholder: "Enter your password"
        }
      )
    ] }),
    isSignUp && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { style: styles.label, children: labels.confirmPassword }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "input",
        {
          type: "password",
          value: confirmPassword,
          onChange: (e) => setConfirmPassword(e.target.value),
          required: true,
          minLength: 8,
          style: styles.input,
          placeholder: "Confirm your password"
        }
      )
    ] }),
    !isSignUp && showForgotPassword && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { textAlign: "right" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        onClick: () => switchView("forgotPassword"),
        style: { ...styles.link, fontSize: "13px" },
        children: labels.forgotPassword
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "submit",
        disabled: submitting,
        style: { ...styles.button, ...submitting ? styles.buttonDisabled : {} },
        children: submitting ? "Loading..." : isSignUp ? labels.signUp : labels.signIn
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.switchLink, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        onClick: () => switchView(isSignUp ? "signIn" : "signUp"),
        style: styles.link,
        children: isSignUp ? labels.switchToSignIn : labels.switchToSignUp
      }
    ) })
  ] }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthForm,
  PicoBaseProvider,
  useAuth,
  useClient,
  useCollection,
  useRealtime
});
