import { uniq } from 'lodash-es';
import { get, writable } from 'svelte/store';

export const arrangeUnit = 65535;

export type Position = number;

export type Positions = ReturnType<typeof createPositions>;

export function createPositions() {
  const { subscribe, update } = writable<Array<Position>>([]);

  const addMany = (positions: Array<Position>) => {
    update((currentPositions) => {
      return uniq([...currentPositions, ...positions]).sort((a, b) => a - b);
    });
  };

  const add = (position: Position) => {
    addMany([position]);
  };

  const remove = (position: Position) => {
    update((positions) => {
      return positions.filter((p) => p !== position);
    });
  };

  return {
    subscribe,
    addMany,
    add,
    remove,
    replace(position: Position, replacePosition: Position) {
      if (position === replacePosition) {
        return;
      }

      this.remove(position);
      this.add(replacePosition);
    },
    getBetween(isWithNext: boolean, position: Position) {
      const positions = get({ subscribe });

      const index = positions.findIndex((p) => p === position);

      const lastIndex = positions.length - 1;
      if (lastIndex === index) {
        return position + arrangeUnit;
      }

      const siblingPosition = positions[index + (isWithNext ? 1 : -1)] ?? 0;
      return (siblingPosition + position) / 2;
    },
  };
}
