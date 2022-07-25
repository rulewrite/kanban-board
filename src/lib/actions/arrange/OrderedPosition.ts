import { uniq } from 'lodash-es';

type Id = Symbol;
type Position = number;
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

  remove(groupId: Id, position: Position) {
    this.set(
      groupId,
      this.getWithInitial(groupId).filter((p) => p !== position)
    );
  }

  replace(groupId: Id, position: Position, replacePosition: Position) {
    if (position === replacePosition) {
      return;
    }

    this.remove(groupId, position);
    this.add(groupId, replacePosition);
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
}

export default OrderedPosition;
