import { merge } from 'lodash-es';
import { writable } from 'svelte/store';
import type { Card, Section } from '../api/jsonPlaceholder';

export interface Entity {
  id: number;
}

export const isDeleted = Symbol('isDeleted');

interface Entities<E extends Entity> {
  [id: string]: E & {
    [isDeleted]?: boolean;
  };
}

function createEntities<E extends Entity>() {
  const { subscribe, update } = writable<Entities<E>>({});

  return {
    subscribe,
    update,
    updateProperty: (id: E['id'], updater: (e: E) => E) => {
      update((state) => {
        state[id] = updater(state[id]);
        return state;
      });
    },
    merge: (entities: Entities<E>) => {
      update((state) => {
        return merge(state, entities);
      });
    },
    delete: (id: keyof Entities<E>) => {
      update((state) => {
        state[id][isDeleted] = true;

        return state;
      });
    },
  };
}

export const SECTIONS_SCHEMA_KEY = 'sections';
export const CARDS_SCHEMA_KEY = 'cards';

export type EntitiesKeys = keyof typeof mapKeyToEntities;
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
