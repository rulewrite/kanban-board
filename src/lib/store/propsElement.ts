import { get, writable } from 'svelte/store';

export function createPropsElement<T extends { [key: string]: any }>() {
  const propsKey = Symbol();
  type PropsElement = HTMLElement & {
    [propsKey: symbol]: T;
  };

  const { subscribe, set } = writable<PropsElement>(null);

  return {
    utils: {
      setNodeProps: (node: HTMLElement, props: T) => {
        node[propsKey] = props;
        return node as PropsElement;
      },
      getNodeProps: (node: PropsElement) => node[propsKey],
    },

    isBound: () => get({ subscribe }) !== null,
    getProps: () => get({ subscribe })[propsKey],

    subscribe,
    bind: (element: PropsElement) => set(element),
    clear: () => set(null),
  };
}
