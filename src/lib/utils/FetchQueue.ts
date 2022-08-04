interface Item<R = any> {
  fetchParams: Parameters<typeof fetch>;
  success: (r: R) => void;
  failure: (e: Error) => void;
}

export default class FetchQueue {
  private static readonly INITIAL_INTERVER_MS = 1000;

  private timeout: NodeJS.Timeout = null;
  private queue: Array<Item> = [];

  constructor() {}

  private async fetch(interverMs: number) {
    if (!this.queue.length) {
      this.timeout = null;
      return;
    }

    const item = this.queue.shift();
    const { fetchParams, success, failure } = item;

    try {
      const response = await (await fetch(...fetchParams)).json();
      success(response);

      this.fetch(0);
    } catch (error) {
      failure(error);

      this.queue.unshift(item);
      this.run(interverMs ? interverMs * 2 : FetchQueue.INITIAL_INTERVER_MS);
    }
  }

  private run(interverMs: number) {
    this.timeout = setTimeout(() => {
      this.fetch(interverMs);
    }, interverMs);
  }

  push<R = Response>(item: Item<R>) {
    this.queue.push(item);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.run(0);
  }
}
