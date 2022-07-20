import { writable } from 'svelte/store';

export function createEditId(id?: string) {
  const emptyId = Symbol();
  const { subscribe, update } = writable<string | Symbol>(id ?? emptyId);

  return {
    subscribe,
    toggle: (id: string) => {
      update((currentId) => {
        if (id === currentId) {
          return emptyId;
        }

        return id;
      });
    },
    off: (id: string) => {
      update((currentId) => {
        if (id !== currentId) {
          return currentId;
        }

        return emptyId;
      });
    },
  };
}
