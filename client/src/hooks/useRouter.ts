import { useSyncExternalStore } from 'react';

let current = window.location.pathname + window.location.search;
const listeners = new Set<() => void>();

function getPath(): string {
  return current;
}

function notify(): void {
  current = window.location.pathname + window.location.search;
  for (const listener of listeners) {
    listener();
  }
}

window.addEventListener('popstate', notify);

function navigate(to: string): void {
  if (to !== window.location.pathname + window.location.search) {
    window.history.pushState({}, '', to);
    notify();
  }
}

export function useRouter() {
  const path = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    getPath,
    getPath
  );

  const pathname = path.split('?')[0];
  const searchParams = new URLSearchParams(path.split('?')[1] ?? '');

  return { path, pathname, searchParams, navigate };
}
