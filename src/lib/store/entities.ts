import { merge } from 'lodash-es';
import { writable } from 'svelte/store';
import type { Section } from '../api/api';

interface Entities<E> {
  [id: string]: E;
}

function createEntities<E>() {
  const { subscribe, update } = writable<Entities<E>>({});

  return {
    subscribe,
    merge: (entities: Entities<E>) => {
      update((state) => {
        return merge(state, entities);
      });
    },
  };
}

export const SECTIONS_SCHEMA_KEY = 'sections';

export const mapKeyToEntities = {
  [SECTIONS_SCHEMA_KEY]: createEntities<Section>(),
} as const;

export const mergeEntities = (normalized: {
  [schemaKey: string]: { [key: string]: any };
}) => {
  Object.entries(normalized).forEach(([schemaKey, entities]) => {
    mapKeyToEntities[schemaKey]?.merge(entities);
  });
};
