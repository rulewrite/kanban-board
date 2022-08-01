import { schema } from 'normalizr';
import {
  CARDS_SCHEMA_KEY,
  SECTIONS_SCHEMA_KEY,
  USERS_SCHEMA_KEY,
} from '../store/entities';
import { arrangeUnit } from '../store/positions';
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

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}
const userSchema = new schema.Entity<User>(USERS_SCHEMA_KEY);
export const userApi = new StatusApi<Params, User>(`${URL}/users`, userSchema);

export interface Card {
  postId: number;
  id: number;
  name: string;
  email: User['email'];
  body: string;
  position: number;
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

export interface Section {
  id: number;
  title: string;
  body: string;
  userId?: number;
  comments?: Array<Card['id']>;
  position: number;
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
