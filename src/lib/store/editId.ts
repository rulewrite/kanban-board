import { writable } from 'svelte/store';

function createEditId(id = NaN) {
  const { subscribe, update } = writable<number>(id);

  return {
    subscribe,
    toggle: (id: number) => {
      update((currentId) => {
        if (id === currentId) {
          return NaN;
        }

        return id;
      });
    },
    off: (id: number) => {
      update((currentId) => {
        if (id !== currentId) {
          return currentId;
        }

        return NaN;
      });
    },
  };
}

export const editSectionId = createEditId();
