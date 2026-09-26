import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Socket } from 'socket.io';
import type {
  AuthenticatedSocket,
  AuthUser,
} from '../../types/global-types.js';

//este guard nos permite obtener el token de session de usuario para poder
//conectarse en el canal webSockets
@Injectable()
export class WsJwtGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const client = context.switchToWs().getClient<Socket>();

    return {
      headers: {
        authorization: `Bearer ${client.handshake.auth.token}`,
      },
    };
  }

  handleRequest<TUser = AuthUser>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
  ): TUser {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    client.data.user = user as AuthUser;

    return user;
  }
}
