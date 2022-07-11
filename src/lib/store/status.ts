import { uniq } from 'lodash-es';
import { normalize, schema } from 'normalizr';
import { derived, writable } from 'svelte/store';
import {
  EntitiesKeys,
  Entity,
  isDeleted,
  mapKeyToEntities,
  mergeEntities,
} from './entities';

export interface Status {
  isFetching: boolean;
  receivedAt: number;
  failMessage: string;
}
function createStatus() {
  const { subscribe, update } = writable<Status>({
    isFetching: false,
    receivedAt: NaN,
    failMessage: '',
  });

  const mergeStatus = (statusToMerge: Partial<Status>) => {
    update((status) => {
      return {
        ...status,
        ...statusToMerge,
      };
    });
  };

  return {
    subscribe,
    request: () => {
      mergeStatus({
        isFetching: true,
      });
    },
    success: () => {
      mergeStatus({
        isFetching: false,
        receivedAt: Date.now(),
        failMessage: '',
      });
    },
    failure: (failMessage: string) => {
      mergeStatus({
        isFetching: false,
        receivedAt: Date.now(),
        failMessage,
      });
    },
  };
}

interface StatusEntity<E extends Entity> {
  key: string;
  id: E['id'] | null;
}
export type StatusEntityStore = ReturnType<
  ReturnType<typeof getCreateStatusEntity>
>;
export function getCreateStatusEntity<E extends Entity>(
  schema: schema.Entity<E>
) {
  const entitiesStore = mapKeyToEntities[schema.key as EntitiesKeys];

  return (key: string) => {
    const {
      subscribe: statusSubscribe,
      request,
      success,
      failure,
    } = createStatus();
    const { update, subscribe } = writable<StatusEntity<E>>({
      key,
      id: null,
    });

    return {
      ...derived(
        [
          { subscribe: statusSubscribe },
          { subscribe },
          { subscribe: entitiesStore.subscribe },
        ],
        ([$status, { id, ...$store }, $entities]) => {
          return {
            ...$status,
            ...$store,
            id: $entities[id]?.[isDeleted] ? null : id,
          };
        }
      ),
      request,
      failure,
      success: (response: E) => {
        const { entities, result } = normalize(response, schema);
        mergeEntities(entities);

        update((store) => {
          return {
            ...store,
            id: result as E['id'],
          };
        });
        success();
      },
      successDelete: (id: E['id']) => {
        entitiesStore.delete(id);
        update((store) => {
          return {
            ...store,
            id,
          };
        });
        success();
      },
    };
  };
}

interface StatusEntities<E extends Entity> {
  key: string;
  ids: Array<E['id']> | null;
}
export type StatusEntitiesStore = ReturnType<
  ReturnType<typeof getCreateStatusEntities>
>;
export function getCreateStatusEntities<E extends Entity>(
  schema: schema.Entity<E>
) {
  const entitiesStore = mapKeyToEntities[schema.key as EntitiesKeys];

  return (key: string) => {
    const {
      subscribe: statusSubscribe,
      request,
      success,
      failure,
    } = createStatus();
    const { update, subscribe } = writable<StatusEntities<E>>({
      key,
      ids: null,
    });

    return {
      ...derived(
        [
          { subscribe: statusSubscribe },
          { subscribe },
          { subscribe: entitiesStore.subscribe },
        ],
        ([$status, { ids, ...$store }, $entities]) => {
          return {
            ...$status,
            ...$store,
            ids: (ids ?? []).filter((id) => !$entities[id][isDeleted]),
          };
        }
      ),
      request,
      failure,
      success: (response: Array<E>) => {
        const { entities, result } = normalize(response, [schema]);
        mergeEntities(entities);

        update((store) => {
          return {
            ...store,
            ids: result as Array<E['id']>,
          };
        });
        success();
      },
      add: (id: E['id']) => {
        update(({ ids, ...store }) => {
          return {
            ...store,
            ids: uniq([...ids, id]),
          };
        });
      },
    };
  };
}
