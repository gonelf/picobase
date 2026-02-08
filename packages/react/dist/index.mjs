// src/PicoBaseProvider.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@picobase_app/client";
import { jsx } from "react/jsx-runtime";
var PicoBaseContext = createContext(null);
function PicoBaseProvider({ url, apiKey, options, children }) {
  const client = useMemo(
    () => createClient(url, apiKey, options),
    [url, apiKey]
  );
  const [user, setUser] = useState(() => client.auth.user);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
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
  const value = useMemo(() => ({ client, user, loading }), [client, user, loading]);
  return /* @__PURE__ */ jsx(PicoBaseContext.Provider, { value, children });
}
function usePicoBaseContext() {
  const ctx = useContext(PicoBaseContext);
  if (!ctx) {
    throw new Error("usePicoBase* hooks must be used within a <PicoBaseProvider>");
  }
  return ctx;
}

// src/hooks.ts
import { useCallback, useEffect as useEffect2, useRef as useRef2, useState as useState2 } from "react";
function useAuth() {
  const { client, user, loading } = usePicoBaseContext();
  const signUp = useCallback(
    (email, password, data) => client.auth.signUp({ email, password, ...data }),
    [client]
  );
  const signIn = useCallback(
    (email, password) => client.auth.signIn({ email, password }),
    [client]
  );
  const signInWithOAuth = useCallback(
    (provider) => client.auth.signInWithOAuth({ provider }),
    [client]
  );
  const signOut = useCallback(() => client.auth.signOut(), [client]);
  const requestPasswordReset = useCallback(
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
  const [items, setItems] = useState2([]);
  const [totalItems, setTotalItems] = useState2(0);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const [refreshKey, setRefreshKey] = useState2(0);
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const doFetch = useCallback(() => {
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
  useState2(() => {
    doFetch();
  });
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  return { items, totalItems, loading, error, refresh };
}
function useRealtime(collectionName, options) {
  const { client } = usePicoBaseContext();
  const [items, setItems] = useState2([]);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const unsubRef = useRef2(null);
  useEffect2(() => {
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
import { useState as useState3 } from "react";
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
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
  const [view, setView] = useState3(mode);
  const [email, setEmail] = useState3("");
  const [password, setPassword] = useState3("");
  const [confirmPassword, setConfirmPassword] = useState3("");
  const [error, setError] = useState3(null);
  const [submitting, setSubmitting] = useState3(false);
  const [resetSent, setResetSent] = useState3(false);
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
    return /* @__PURE__ */ jsx2("div", { style: styles.container, className, children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, style: styles.form, children: [
      /* @__PURE__ */ jsx2("div", { style: styles.title, children: labels.resetPassword }),
      error && /* @__PURE__ */ jsx2("div", { style: styles.error, children: error }),
      resetSent && /* @__PURE__ */ jsx2("div", { style: styles.success, children: labels.resetEmailSent }),
      !resetSent && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx2("label", { style: styles.label, children: labels.email }),
          /* @__PURE__ */ jsx2(
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
        /* @__PURE__ */ jsx2(
          "button",
          {
            type: "submit",
            disabled: submitting,
            style: { ...styles.button, ...submitting ? styles.buttonDisabled : {} },
            children: submitting ? "Sending..." : labels.resetPassword
          }
        )
      ] }),
      /* @__PURE__ */ jsx2("div", { style: styles.switchLink, children: /* @__PURE__ */ jsx2(
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
  return /* @__PURE__ */ jsx2("div", { style: styles.container, className, children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, style: styles.form, children: [
    /* @__PURE__ */ jsx2("div", { style: styles.title, children: isSignUp ? labels.signUp : labels.signIn }),
    error && /* @__PURE__ */ jsx2("div", { style: styles.error, children: error }),
    providers.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx2("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: providers.map((provider) => /* @__PURE__ */ jsx2(
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
      /* @__PURE__ */ jsxs("div", { style: styles.divider, children: [
        /* @__PURE__ */ jsx2("div", { style: styles.dividerLine }),
        /* @__PURE__ */ jsx2("span", { children: labels.orContinueWith }),
        /* @__PURE__ */ jsx2("div", { style: styles.dividerLine })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx2("label", { style: styles.label, children: labels.email }),
      /* @__PURE__ */ jsx2(
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
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx2("label", { style: styles.label, children: labels.password }),
      /* @__PURE__ */ jsx2(
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
    isSignUp && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx2("label", { style: styles.label, children: labels.confirmPassword }),
      /* @__PURE__ */ jsx2(
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
    !isSignUp && showForgotPassword && /* @__PURE__ */ jsx2("div", { style: { textAlign: "right" }, children: /* @__PURE__ */ jsx2(
      "button",
      {
        type: "button",
        onClick: () => switchView("forgotPassword"),
        style: { ...styles.link, fontSize: "13px" },
        children: labels.forgotPassword
      }
    ) }),
    /* @__PURE__ */ jsx2(
      "button",
      {
        type: "submit",
        disabled: submitting,
        style: { ...styles.button, ...submitting ? styles.buttonDisabled : {} },
        children: submitting ? "Loading..." : isSignUp ? labels.signUp : labels.signIn
      }
    ),
    /* @__PURE__ */ jsx2("div", { style: styles.switchLink, children: /* @__PURE__ */ jsx2(
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
export {
  AuthForm,
  PicoBaseProvider,
  useAuth,
  useClient,
  useCollection,
  useRealtime
};
