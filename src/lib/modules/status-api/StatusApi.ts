import { uniq } from 'lodash-es';
import { normalize, schema } from 'normalizr';
import { get } from 'svelte/store';
import { mapKeyToEntities, mergeEntities } from '../../store/entities';
import { Cargo, createStatus, StatusStore } from './status';

export default class StatusApi<P extends Object, E extends { id: number }> {
  private static paramsToString<P>(params: P) {
    if (!params) {
      return '';
    }

    const pairs = Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`);

    if (!pairs.length) {
      return '';
    }

    return `?${pairs.join('&')}`;
  }

  private static minutesToMs(minutes: number) {
    return minutes * 60 * 1000;
  }

  private static getUrl<P>(pathname: string, params: P) {
    return `${pathname}${StatusApi.paramsToString(params)}`;
  }

  private mapKeyToStatus = new Map<string, ReturnType<typeof createStatus>>();

  constructor(
    private readonly URL: string,
    private readonly schema: schema.Entity<E>,
    private expirationMinutes = 0
  ) {}

  private mergeEntities<R, C extends Cargo>(response: R) {
    const { entities, result } = normalize(
      response,
      Array.isArray(response) ? [this.schema] : this.schema
    );

    mergeEntities(entities);

    return result as C;
  }

  create({
    key,
    body,
    params,
  }: {
    key: string;
    body: Omit<E, 'id'>;
    params?: P;
  }) {
    const url = StatusApi.getUrl<P>(this.URL, params);
    const status = createStatus<E['id']>(url);

    const $status = get(status);
    if ($status.isFetching) {
      return status;
    }

    status.request();
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
      .then<E>((response) => response.json())
      .then((response) => {
        const result = this.mergeEntities<E, E['id']>({ ...response, ...body });

        status.success(result);

        this.mapKeyToStatus.get(key)?.updateCargo((cargo: Array<number>) => {
          return uniq([...cargo, result]);
        });
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return status;
  }

  read({ id, params, isForce }: { id: E['id']; params: P; isForce?: boolean }) {
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);

    if (!this.mapKeyToStatus.has(url)) {
      this.mapKeyToStatus.set(url, createStatus(url));
    }
    const status = this.mapKeyToStatus.get(url) as StatusStore<E['id']>;

    const $status = get(status);
    if ($status.isFetching) {
      return status;
    }

    if (
      isForce ||
      !this.expirationMinutes ||
      !$status.receivedAt ||
      Date.now() - $status.receivedAt >
        StatusApi.minutesToMs(this.expirationMinutes)
    ) {
      status.request();
      fetch(url)
        .then<E>((response) => response.json())
        .then((response) => {
          status.success(this.mergeEntities<E, E['id']>(response));
        })
        .catch((error: Error) => {
          status.failure(error.message ?? 'Unknown Error');
        });
    }

    return status;
  }

  readList({ params, isForce }: { params: P; isForce?: boolean }) {
    const url = StatusApi.getUrl<P>(this.URL, params);

    if (!this.mapKeyToStatus.has(url)) {
      this.mapKeyToStatus.set(url, createStatus(url));
    }
    const status = this.mapKeyToStatus.get(url) as StatusStore<Array<E['id']>>;

    const $status = get(status);
    if ($status.isFetching) {
      return status;
    }

    if (
      isForce ||
      !this.expirationMinutes ||
      !$status.receivedAt ||
      Date.now() - $status.receivedAt >
        StatusApi.minutesToMs(this.expirationMinutes)
    ) {
      status.request();
      fetch(url)
        .then<Array<E>>((response) => response.json())
        .then((response) => {
          status.success(
            this.mergeEntities<Array<E>, Array<E['id']>>(response)
          );
        })
        .catch((error: Error) => {
          status.failure(error.message ?? 'Unknown Error');
        });
    }

    return status;
  }

  update({ id, body, params }: { id: E['id']; body: Partial<E>; params?: P }) {
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);
    const status = createStatus<E['id']>(url);

    status.request();
    fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
      .then<E>((response) => response.json())
      .then((response) => {
        status.success(
          this.mergeEntities<E, E['id']>({
            ...response,
            ...body,
          })
        );
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return status;
  }

  delete({ id, key, params }: { id: number; key: string; params?: P }) {
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);
    const status = createStatus<E['id']>(url);

    const $status = get(status);
    if ($status.isFetching) {
      return status;
    }

    status.request();
    fetch(url, {
      method: 'DELETE',
    })
      .then<{}>((response) => response.json())
      .then(() => {
        status.success(id);

        const entities = mapKeyToEntities[this.schema.key];
        entities?.delete(id);

        this.mapKeyToStatus.get(key)?.updateCargo((cargo: Array<E['id']>) => {
          return cargo.filter((element) => element !== id);
        });
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return status;
  }
}
