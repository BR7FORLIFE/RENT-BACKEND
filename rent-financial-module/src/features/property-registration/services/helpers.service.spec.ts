import {
  CreateSuggestionByPropertyField,
  PropertyHelper,
  unionInfoUser,
  validateInvitationLinked,
} from './helpers.service.js';
import { ActorRoleException } from '../exceptions/domain-exceptions.js';
import {
  InvitationLinkedExpiredException,
  InvitationLinkedStatusNotAllowedException,
} from '../exceptions/exceptions.js';
import { CallModelStream } from '../../../core/IA/IA-cclient.js';

jest.mock('../../../core/IA/IA-cclient.js', () => ({
  CallModelStream: jest.fn(),
}));

describe('PropertyHelper', () => {
  const helper = new PropertyHelper();

  describe('cleanUndefined', () => {
    it('elimina llaves undefined pero conserva null, 0, false y ""', () => {
      expect(
        helper.cleanUndefined({ a: undefined, b: null, c: 0, d: false, e: '' }),
      ).toEqual({ b: null, c: 0, d: false, e: '' });
    });

    it('no muta el objeto original', () => {
      const original = { a: undefined, b: 1 };
      helper.cleanUndefined(original);
      expect(original).toHaveProperty('a');
    });
  });

  describe('IsActorRole', () => {
    it('compare=true: no lanza si el rol está presente', () => {
      expect(() =>
        helper.IsActorRole('ADMINISTRADOR', ['ADMINISTRADOR']),
      ).not.toThrow();
    });

    it('compare=true: lanza ActorRoleException si falta el rol', () => {
      expect(() => helper.IsActorRole('ADMINISTRADOR', ['INVITADO'])).toThrow(
        ActorRoleException,
      );
    });

    it('compare=false: lanza si el rol está presente', () => {
      expect(() => helper.IsActorRole('INVITADO', ['INVITADO'], false)).toThrow(
        ActorRoleException,
      );
    });

    it('compare=false: no lanza si el rol está ausente', () => {
      expect(() =>
        helper.IsActorRole('INVITADO', ['MIEMBRO'], false),
      ).not.toThrow();
    });
  });
});

describe('validateInvitationLinked', () => {
  const base = {
    status: 'DRAFT',
    expirationTime: new Date(Date.now() + 60_000),
  } as never;

  it('acepta invitaciones DRAFT vigentes', () => {
    expect(() => validateInvitationLinked(base)).not.toThrow();
  });

  it.each(['CONSUMED', 'REVOCKED', 'EXPIRED'])(
    'rechaza estado %s',
    (status) => {
      expect(() =>
        validateInvitationLinked({ ...(base as object), status } as never),
      ).toThrow(InvitationLinkedStatusNotAllowedException);
    },
  );

  it('rechaza invitaciones vencidas', () => {
    expect(() =>
      validateInvitationLinked({
        status: 'DRAFT',
        expirationTime: new Date(Date.now() - 1),
      } as never),
    ).toThrow(InvitationLinkedExpiredException);
  });
});

describe('unionInfoUser', () => {
  it('combina datos de propiedad (part1) con datos de auth (part2) por userId', () => {
    const part1 = [
      {
        id: 'm1',
        userId: 'u1',
        status: 'ACTIVE',
        assignedAt: new Date(),
        roles: ['PROPIETARIO'],
        policies: ['A'],
        overrides: [],
      },
    ] as never;
    const part2 = [{ userId: 'u1', fullname: 'Ana', email: 'a@b.co' }] as never;

    const [merged] = unionInfoUser(part1, part2);

    expect(merged).toMatchObject({
      id: 'm1',
      userId: 'u1',
      fullname: 'Ana',
      roles: ['PROPIETARIO'],
    });
  });

  it('conserva el orden de part2', () => {
    const part1 = [
      { userId: 'u1', id: 'm1' },
      { userId: 'u2', id: 'm2' },
    ] as never;
    const part2 = [{ userId: 'u2' }, { userId: 'u1' }] as never;

    expect(unionInfoUser(part1, part2).map((x) => x.id)).toEqual(['m2', 'm1']);
  });
});

describe('CreateSuggestionByPropertyField', () => {
  const chat = CallModelStream as jest.Mock;
  beforeEach(() => chat.mockReset());

  it('parsea el JSON devuelto por el modelo', async () => {
    chat.mockResolvedValue({
      message: { content: '{"name":"Casa","description":"Bonita"}' },
    });

    await expect(
      CreateSuggestionByPropertyField('PropertyName'),
    ).resolves.toEqual({ name: 'Casa', description: 'Bonita' });
    expect(chat.mock.calls[0][0]).toContain('PropertyName');
  });

  it('propaga el error si el modelo no devuelve JSON válido', async () => {
    chat.mockResolvedValue({ message: { content: 'no json' } });

    await expect(
      CreateSuggestionByPropertyField('PropertyName'),
    ).rejects.toThrow(SyntaxError);
  });
});
