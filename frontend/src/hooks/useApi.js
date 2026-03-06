import { useCallback, useState } from "react";

export function useApi(action, immediate = false) {
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState("");

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError("");
      try {
        return await action(...args);
      } catch (err) {
        setError(
          err?.response?.data?.message || err.message || "Request failed",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [action],
  );

  return { run, loading, error, setError };
}
