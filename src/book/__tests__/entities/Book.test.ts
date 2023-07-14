import { DataSource, BaseEntity } from 'typeorm';
import crypto from 'crypto';

import {
  Book,
  Commodity,
  Transaction,
  Split,
  Account,
} from '../../entities';

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

describe('Book', () => {
  let instance: Book;
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Book, Commodity, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    const root = await Account.create({
      name: 'name',
      type: 'ROOT',
    }).save();

    instance = await Book.create({
      fk_root: root,
    }).save();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  it('is active record', () => {
    expect(instance).toBeInstanceOf(BaseEntity);
  });

  it('can retrieve books', async () => {
    const books = await Book.find({ relations: ['fk_root'] });

    expect(books[0].root.name).toEqual('name');
  });
});
