import { uniq } from 'lodash-es';
import { normalize, schema } from 'normalizr';
import { derived, writable } from 'svelte/store';
import { Entity, mergeEntities } from '../../store/entities';

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

interface StatusEntity {
  key: string;
  id: Entity['id'] | null;
}
export type StatusEntityStore = ReturnType<
  ReturnType<typeof getCreateStatusEntity>
>;
export function getCreateStatusEntity<E extends Entity>(
  schema: schema.Entity<E>
) {
  return (key: string) => {
    const {
      subscribe: statusSubscribe,
      request,
      success,
      failure,
    } = createStatus();
    const { update, subscribe } = writable<StatusEntity>({
      key,
      id: null,
    });

    return {
      ...derived(
        [{ subscribe: statusSubscribe }, { subscribe }],
        ([$status, $store]) => {
          return {
            ...$status,
            ...$store,
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
    };
  };
}

interface StatusEntities {
  key: string;
  ids: Array<Entity['id']> | null;
}
export type StatusEntitiesStore = ReturnType<
  ReturnType<typeof getCreateStatusEntities>
>;
export function getCreateStatusEntities<E extends Entity>(
  schema: schema.Entity<E>
) {
  return (key: string) => {
    const {
      subscribe: statusSubscribe,
      request,
      success,
      failure,
    } = createStatus();
    const { update, subscribe } = writable<StatusEntities>({
      key,
      ids: null,
    });

    return {
      ...derived(
        [{ subscribe: statusSubscribe }, { subscribe }],
        ([$status, $store]) => {
          return {
            ...$status,
            ...$store,
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
        update((store) => {
          return {
            ...store,
            ids: uniq([...store.ids, id]),
          };
        });
      },
      delete: (id: E['id']) => {
        update((store) => {
          return {
            ...store,
            ids: store.ids.filter((element) => element !== id),
          };
        });
      },
    };
  };
}
