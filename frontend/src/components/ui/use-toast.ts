import { useEffect, useState } from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 1;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
  dismiss: () => void;
};

type ToastInput = Omit<ToasterToast, 'id' | 'dismiss'>;

interface ToastState {
  toasts: ToasterToast[];
}

type Listener = (state: ToastState) => void;

const toastStore = {
  state: { toasts: [] } as ToastState,
  listeners: [] as Listener[],

  getState: (): ToastState => toastStore.state,

  setState: (nextState: ToastState | ((prev: ToastState) => ToastState)): void => {
    toastStore.state =
      typeof nextState === 'function'
        ? nextState(toastStore.state)
        : { ...toastStore.state, ...nextState };
    toastStore.listeners.forEach((listener) => listener(toastStore.state));
  },

  subscribe: (listener: Listener): (() => void) => {
    toastStore.listeners.push(listener);
    return () => {
      toastStore.listeners = toastStore.listeners.filter((l) => l !== listener);
    };
  },
};

let count = 0;
function generateId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

export const toast = (props: ToastInput) => {
  const id = generateId();

  const update = (updated: Partial<ToasterToast>) =>
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...updated } : t)),
    }));

  const dismiss = () =>
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.filter((t) => t.id !== id),
    }));

  toastStore.setState((state) => ({
    ...state,
    toasts: [{ ...props, id, dismiss }, ...state.toasts].slice(0, TOAST_LIMIT),
  }));

  return { id, dismiss, update };
};

export function useToast() {
  const [state, setState] = useState<ToastState>(toastStore.getState());

  useEffect(() => {
    return toastStore.subscribe(setState);
  }, []);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    state.toasts.forEach((t) => {
      if (t.duration === Infinity) return;
      const timeout = setTimeout(() => t.dismiss(), t.duration ?? 5000);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [state.toasts]);

  return { toast, toasts: state.toasts };
}
