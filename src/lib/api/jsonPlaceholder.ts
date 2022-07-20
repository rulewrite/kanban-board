import { schema } from 'normalizr';
import { Arrangeable, arrangeUnit } from '../actions/arrange/arrange';
import { CARDS_SCHEMA_KEY, SECTIONS_SCHEMA_KEY } from '../store/entities';
import StatusApi from './StatusApi';

interface Params {
  // Paginate
  _page?: number;
  _limit?: number;

  // Relationships
  _expand?: string;
  _embed?: string;

  // Search
  q?: string;
}

const URL = 'https://jsonplaceholder.typicode.com';

export interface Card extends Arrangeable {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}
const cardSchema = new schema.Entity<Card>(
  CARDS_SCHEMA_KEY,
  {},
  {
    processStrategy: (card) => {
      if (card.position) {
        return card;
      }

      return {
        ...card,
        position: arrangeUnit * card.id,
      };
    },
  }
);
export const cardApi = new StatusApi<Params, Card>(
  `${URL}/comments`,
  cardSchema
);

export interface Section extends Arrangeable {
  id: number;
  title: string;
  body: string;
  userId?: number;
  comments?: Array<Card['id']>;
}
export const sectionApi = new StatusApi<Params, Section>(
  `${URL}/posts`,
  new schema.Entity<Section>(
    SECTIONS_SCHEMA_KEY,
    {
      comments: [cardSchema],
    },
    {
      processStrategy: (section) => {
        if (section.position) {
          return section;
        }

        return {
          ...section,
          position: arrangeUnit * section.id,
        };
      },
    }
  ),
  1
);
