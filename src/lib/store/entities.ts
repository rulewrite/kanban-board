import { merge } from 'lodash-es';
import { writable } from 'svelte/store';
import type { Card, Section } from '../api/jsonPlaceholder';

export interface Entity {
  id: number;
}

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
    delete: (id: keyof Entities<E>) => {
      update((state) => {
        delete state[id];

        return state;
      });
    },
  };
}

export const SECTIONS_SCHEMA_KEY = 'sections';
export const CARDS_SCHEMA_KEY = 'cards';

export const mapKeyToEntities = {
  [SECTIONS_SCHEMA_KEY]: createEntities<Section>(),
  [CARDS_SCHEMA_KEY]: createEntities<Card>(),
} as const;

export const mergeEntities = (normalized: {
  [schemaKey: string]: { [key: string]: any };
}) => {
  Object.entries(normalized).forEach(([schemaKey, entities]) => {
    mapKeyToEntities[schemaKey]?.merge(entities);
  });
};
