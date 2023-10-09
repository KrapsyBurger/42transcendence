import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // get the request object from the context
    const request: Express.Request = ctx.switchToHttp().getRequest();

    // if data is defined, return the value of the property
    if (data) {
      return request.user[data];
    }
    // if data is undefined, return the whole user object
    return request.user;
  },
);
