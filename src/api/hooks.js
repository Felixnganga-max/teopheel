// Tiny data hooks so no extra library is needed.
//   const { data, meta, loading, error, refetch } = useQuery(() => getOrders(filters), [filters.status], { pollMs: 10000 });
//   const { mutate, loading, error } = useMutation(dispatchOrder);   await mutate(payload)
import { useCallback, useEffect, useRef, useState } from 'react';

export function useQuery(fetcher, deps = [], { enabled = true, pollMs = 0 } = {}) {
  const [state, setState] = useState({ data: null, meta: null, loading: enabled, error: null });
  const fetchRef = useRef(fetcher);
  useEffect(() => { fetchRef.current = fetcher; }); // keep latest fetcher without re-running effects
  const reqId = useRef(0);

  const run = useCallback(async (silent = false) => {
    const id = ++reqId.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, ...meta } = await fetchRef.current();
      if (id !== reqId.current) return; // stale response
      setState({ data, meta, loading: false, error: null });
    } catch (error) {
      if (id !== reqId.current) return;
      setState((s) => ({ ...s, loading: false, error }));
    }
  }, []);

  useEffect(() => () => { reqId.current = -1; }, []); // ignore results after unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (enabled) run(); }, [enabled, run, ...deps]);
  useEffect(() => {
    if (!enabled || !pollMs) return undefined;
    const t = setInterval(() => run(true), pollMs);
    return () => clearInterval(t);
  }, [enabled, pollMs, run]);

  return { ...state, refetch: () => run() };
}

export function useMutation(fn) {
  const [state, setState] = useState({ loading: false, error: null });
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });

  const mutate = useCallback(async (...args) => {
    setState({ loading: true, error: null });
    try {
      const body = await fnRef.current(...args);
      setState({ loading: false, error: null });
      return body; // full backend body
    } catch (error) {
      setState({ loading: false, error });
      throw error;
    }
  }, []);

  return { mutate, ...state, reset: () => setState({ loading: false, error: null }) };
}
