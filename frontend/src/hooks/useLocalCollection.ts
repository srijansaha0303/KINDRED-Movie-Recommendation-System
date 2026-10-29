import { useEffect, useState } from "react";

function getScopedKey(baseKey: string): string {
  try {
    const raw = localStorage.getItem("kindred_auth");
    const userId = raw ? JSON.parse(raw).userId : null;
    return userId ? `${baseKey}:${userId}` : `${baseKey}:guest`;
  } catch {
    return `${baseKey}:guest`;
  }
}

// Backend has no Watch List / Watch History endpoints yet (not in the
// MovieLens schema or your Neo4j graph). This persists locally, scoped
// per logged-in user (falls back to a shared "guest" bucket if logged
// out), so it's fully usable now, structured so a real backend-backed
// version can swap in later without changing calling components.
export function useLocalCollection<T extends { movieId: number }>(baseKey: string) {
  const storageKey = getScopedKey(baseKey);

  const [items, setItems] = useState<T[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  });

  // Re-read if the logged-in user changes (login/logout) without a full page reload
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setItems(raw ? (JSON.parse(raw) as T[]) : []);
    } catch {
      setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  function add(item: T) {
    setItems((prev) =>
      prev.some((i) => i.movieId === item.movieId) ? prev : [item, ...prev]
    );
  }

  function remove(movieId: number) {
    setItems((prev) => prev.filter((i) => i.movieId !== movieId));
  }

  function has(movieId: number) {
    return items.some((i) => i.movieId === movieId);
  }

  function update(movieId: number, patch: Partial<T>) {
    setItems((prev) =>
      prev.map((i) => (i.movieId === movieId ? { ...i, ...patch } : i))
    );
  }

  return { items, add, remove, has, update };
}
