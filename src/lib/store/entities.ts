import { merge } from 'lodash-es';
import { get, writable } from 'svelte/store';
import type { Card, Section } from '../api/jsonPlaceholder';
import { createPositions, Position } from './positions';

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
    updateEntity: (id: E['id'], updater: (e: E) => E) => {
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
    delete: (id: E['id']) => {
      update((state) => {
        state[id][isDeleted] = true;

        return state;
      });
    },
  };
}

export interface OrderedEntity extends Entity {
  position: Position;
}

function createOrderedEntities<Oe extends OrderedEntity>() {
  const {
    subscribe,
    updateEntity,
    merge,
    delete: deleteAction,
  } = createEntities<Oe>();
  const positions = createPositions();

  const getEntities = () => get({ subscribe });

  return {
    subscribe,
    positions,
    updateEntity: (id: Oe['id'], updater: (e: Oe) => Oe) => {
      const entity = getEntities()[id];

      updateEntity(id, updater);

      positions.replace(entity.position, getEntities()[id].position);
    },
    merge: (entities: Entities<Oe>) => {
      merge(entities);

      positions.addMany(
        Object.values(entities).map((entity) => entity.position)
      );
    },
    delete: (id: Oe['id']) => {
      deleteAction(id);

      const entity = getEntities()[id];
      positions.remove(entity.position);
    },
  };
}

export const SECTIONS_SCHEMA_KEY = 'sections';
export const CARDS_SCHEMA_KEY = 'cards';

export type EntitiesKeys = keyof typeof mapKeyToEntities;
export const mapKeyToEntities = {
  [SECTIONS_SCHEMA_KEY]: createOrderedEntities<Section>(),
  [CARDS_SCHEMA_KEY]: createOrderedEntities<Card>(),
} as const;

export const mergeEntities = (normalized: {
  [schemaKey: string]: { [key: string]: any };
}) => {
  Object.entries(normalized).forEach(([schemaKey, entities]) => {
    mapKeyToEntities[schemaKey]?.merge(entities);
  });
};
