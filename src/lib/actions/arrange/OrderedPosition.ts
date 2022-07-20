import { uniq } from 'lodash-es';

export type Id = Symbol;

export type Position = number;

export const arrangeUnit = 65535;

class OrderedPosition {
  private mapPositions = new Map<Id, Array<Position>>();

  constructor() {}

  private set(groupId: Id, positions: Array<Position>) {
    this.mapPositions.set(
      groupId,
      uniq(positions).sort((a, b) => a - b)
    );
  }

  private getWithInitial(groupId: Id) {
    const mapPositions = this.mapPositions;

    if (!mapPositions.has(groupId)) {
      mapPositions.set(groupId, []);
    }

    return mapPositions.get(groupId);
  }

  add(groupId: Id, position: Position) {
    const positions = this.getWithInitial(groupId);
    positions.push(position);
    this.set(groupId, positions);
  }

  getBetween(groupId: Id, isNext: boolean, position: Position) {
    const positions = this.getWithInitial(groupId);

    const index = positions.findIndex((p) => p === position);

    const isLast = positions.length - 1 === index;
    if (isLast) {
      return position + arrangeUnit;
    }

    const prevPosition = positions[index + (isNext ? 1 : -1)] ?? 0;
    return (prevPosition + position) / 2;
  }

  substitution(groupId: Id, position: Position, nextPosition: Position) {
    if (position === nextPosition) {
      return;
    }

    const positions = this.getWithInitial(groupId).filter(
      (p) => p !== position
    );
    positions.push(nextPosition);
    this.set(groupId, positions);
  }
}

export default OrderedPosition;
