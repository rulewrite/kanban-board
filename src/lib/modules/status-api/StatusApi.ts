import { uniq } from 'lodash-es';
import type { schema } from 'normalizr';
import { get } from 'svelte/store';
import type { Entity } from '../../store/entities';
import { getCreateStatus, StatusStore } from './status';

export default class StatusApi<P extends Object, E extends Entity> {
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

  private mapKeyToStatus = new Map<string, StatusStore>();

  private createStatus: ReturnType<typeof getCreateStatus>;

  constructor(
    private readonly URL: string,
    schema: schema.Entity<E>,
    private expirationMinutes = 0
  ) {
    this.createStatus = getCreateStatus<E>(schema);
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
    const status = this.createStatus<E['id']>(url);

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
        const result = status.success<E>({
          ...response,
          ...body,
        });

        this.mapKeyToStatus.get(key)?.updateCargo((cargo: Array<E['id']>) => {
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
      this.mapKeyToStatus.set(url, this.createStatus(url));
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
          status.success<E>(response);
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
      this.mapKeyToStatus.set(url, this.createStatus(url));
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
          status.success<Array<E>>(response);
        })
        .catch((error: Error) => {
          status.failure(error.message ?? 'Unknown Error');
        });
    }

    return status;
  }

  update({ id, body, params }: { id: E['id']; body: Partial<E>; params?: P }) {
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);
    const status = this.createStatus<E['id']>(url);

    status.request();
    fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
      .then<E>((response) => response.json())
      .then((response) => {
        status.success<E>({
          ...response,
          ...body,
        });
      })
      .catch((error: Error) => {
        status.failure(error.message ?? 'Unknown Error');
      });

    return status;
  }

  delete({ id, key, params }: { id: E['id']; key: string; params?: P }) {
    const url = StatusApi.getUrl<P>(`${this.URL}/${id}`, params);
    const status = this.createStatus<E['id']>(url);

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
        status.successDelete(id);

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
