import { get } from 'svelte/store';
import { createStatus, StatusStore } from './status';

export default class StatusApi<P extends Object> {
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

  private mapKeyToStatus = new Map<string, ReturnType<typeof createStatus>>();

  constructor(private readonly URL: string) {}

  private getUrl(pathname: string, params: P) {
    return `${this.URL}/${pathname}${StatusApi.paramsToString(params)}`;
  }

  private async request<R, C = R>({
    status,
    fetch,
    intercepter,
  }: {
    status: ReturnType<typeof createStatus>;
    fetch: Promise<Response>;
    intercepter?: (response: R) => C;
  }) {
    try {
      status.request();

      const response: R = await (await fetch).json();
      status.success(
        intercepter ? intercepter(response) : (response as unknown as C)
      );
    } catch (error) {
      status.failure(error instanceof Error ? error.message : 'Unknown Error');
    }
  }

  getStatus<C>(key: string) {
    return (this.mapKeyToStatus.get(key) as StatusStore<C>) ?? null;
  }

  get<R, C = R>({
    pathname,
    params,
    intercepter,
  }: {
    pathname: string;
    params: P;
    intercepter?: (response: R) => C;
  }) {
    const url = this.getUrl(pathname, params);

    if (!this.mapKeyToStatus.has(url)) {
      this.mapKeyToStatus.set(url, createStatus<C>(url));
    }
    const status = this.mapKeyToStatus.get(url) as StatusStore<C>;

    const $status = get(status);
    if ($status.isFetching) {
      return status;
    }

    this.request<R, C>({ status, fetch: fetch(url), intercepter });

    return status;
  }

  set<R, C = R>({
    pathname,
    params,
    method,
    body,
    intercepter,
  }: {
    pathname: string;
    params: P;
    method: 'POST' | 'PATCH' | 'DELETE';
    body?: Partial<R>;
    intercepter?: (response: R) => C;
  }) {
    const url = this.getUrl(pathname, params);
    const status = createStatus<C>(url);

    const $status = get(status);
    if (method !== 'PATCH' && $status.isFetching) {
      return status;
    }

    this.request<R, C>({
      status,
      fetch: fetch(url, {
        method,
        body: JSON.stringify(body),
      }),
      intercepter,
    });

    return status;
  }
}
