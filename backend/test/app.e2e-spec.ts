import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { signupDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user1: any;
  let user2: any;
  let message1: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.listen(3333);

    // Clean the database before running any tests
    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    // Create test users
    user1 = await prisma.user.create({
      data: {
        username: 'test1',
        hash: '123',
        email: 'test1@mail.com',
        avatar: 'https://example.com/avatar.jpg',
        twoFactorAuthenticationSecret: 'yourSecret',
        isTwoFactorAuthenticationEnabled: false,
        isQrCodeScanned: false,
      },
    });

    user2 = await prisma.user.create({
      data: {
        username: 'test2',
        hash: '123',
        email: 'test2@mail.com',
        avatar: 'https://example.com/avatar.jpg',
        twoFactorAuthenticationSecret: 'yourSecret',
        isTwoFactorAuthenticationEnabled: false,
        isQrCodeScanned: false,
      },
    });

    // Create a test message
    message1 = await prisma.message.create({
      data: {
        senderId: user1.id,
        receiverId: user2.id,
        content: 'Test message!',
        isChannelMessage: true,
      },
    });

    // Set the base URL for all requests
    pactum.request.setBaseUrl(`http://${localhost}:3333`);
  });

  afterAll(() => {
    app.close();
  });

  // auth module tests
  describe('Auth', () => {
    const dto: signupDto = {
      username: 'test',
      password: '123',
      email: 'test@mail.com',
      avatar: 'https://example.com/avatar.jpg',
      isTwoFAActivated: false,
    };

    // signup tests
    describe('Signup', () => {
      it('should throw if username empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password }) // only password, username missing
          .expectStatus(400);
      });

      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ username: dto.username }) // only username, password missing
          .expectStatus(400);
      });

      it('should throw if no body provided', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
          .stores('AccessToken', 'access_token')
          .stores('UserId', 'userId');
      });
    });

    // signin tests
    describe('Signin', () => {
      it('should throw if username empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ password: dto.password }) // only password, username missing
          .expectStatus(400);
      });

      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ username: dto.username }) // only username, password missing
          .expectStatus(400);
      });

      it('should throw if no body provided', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });

      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200);
      });
    });
  });

  // chat module tests
  describe('Chat', () => {
    describe('Get Chat', () => {
      it('should throw 400 if id is not a number', () => {
        const invalidUserId = 'abc';
        return pactum
          .spec()
          .get(`/chat/${invalidUserId}`)
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .expectStatus(400);
      });

      it('should throw 401 if signed token is missing', () => {
        return pactum.spec().get('/chat/$S{UserId}').expectStatus(401);
      });

      it('should throw 401 if signed token is invalid', () => {
        return pactum
          .spec()
          .get('/chat/$S{UserId}')
          .withHeaders({ Authorization: 'Bearer invalid_token' })
          .expectStatus(401);
      });

      it('should get chat between the two users', () => {
        return pactum
          .spec()
          .get('/chat/$S{UserId}')
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .expectStatus(200)
          .expect((ctx) => {
            if (!Array.isArray(ctx.res.json)) {
              throw new Error(
                `Response body should be an array, but it is ${typeof ctx.res
                  .json}`,
              );
            }
            ctx.res.json.forEach((message) => {
              if (
                !(
                  message.senderId === Number('$S{UserId}') ||
                  message.receiverId === Number('$S{UserId}')
                )
              ) {
                throw new Error(
                  `Message doesn't belong to the chat between users`,
                );
              }
            });
          });
      });
    });

    describe('PATCH /read/:id', () => {
      it('should return 400 if id is not a number', async () => {
        return pactum
          .spec()
          .patch(`/chat/read/abc`)
          .withHeaders({
            Authorization: `Bearer $S{AccessToken}`,
          })
          .expectStatus(400);
      });

      it('should return 401 if signed token is missing', async () => {
        return pactum
          .spec()
          .patch(`/chat/read/${message1.id}`)
          .expectStatus(401);
      });

      it('should return 401 if signed token is invalid', async () => {
        return pactum
          .spec()
          .patch(`/chat/read/${message1.id}`)
          .withHeaders({
            Authorization: `Bearer invalidtoken`,
          })
          .expectStatus(401);
      });

      it('should return 404 if message does not exist', async () => {
        return pactum
          .spec()
          .patch(`/chat/read/9999`)
          .withHeaders({
            Authorization: `Bearer $S{AccessToken}`,
          })
          .expectStatus(404);
      });

      it('should read a chat message by id', async () => {
        return pactum
          .spec()
          .patch(`/chat/read/${message1.id}`)
          .withHeaders({
            Authorization: `Bearer $S{AccessToken}`,
          })
          .expectStatus(200)
          .expectJsonLike({
            userId: '$S{UserId}',
            messageId: message1.id,
          });
      });
    });
  });

  // user module tests
  describe('User', () => {
    describe('Get me', () => {
      it('should throw 401 if signed token is missing', () => {
        return pactum.spec().get('/users/me').expectStatus(401);
      });

      it('should throw 401 if signed token is invalid', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: 'Bearer invalid_token' })
          .expectStatus(401);
      });

      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' }) // use the access token stored in the variable AccessToken
          .expectStatus(200);
        // .stores('UserId', 'id'); // store the user id in the variable userId
      });
    });

    describe('Get user', () => {
      it('should throw 404 if user not found', () => {
        const nonExistingUserId = 999999;
        return pactum
          .spec()
          .get(`/users/${nonExistingUserId}`)
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .expectStatus(404);
      });

      it('should throw 400 if id is not a number', () => {
        const invalidUserId = 'abc';
        return pactum
          .spec()
          .get(`/users/${invalidUserId}`)
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .expectStatus(400);
      });

      it('should throw 401 if signed token is missing', () => {
        return pactum.spec().get('/users/$S{UserId}').expectStatus(401);
      });

      it('should throw 401 if signed token is invalid', () => {
        return pactum
          .spec()
          .get('/users/$S{UserId}')
          .withHeaders({ Authorization: 'Bearer invalid_token' })
          .expectStatus(401);
      });

      it('should get user by id', () => {
        return pactum
          .spec()
          .get('/users/$S{UserId}')
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .expectStatus(200);
      });
    });

    describe('Get users', () => {
      it('should throw 401 if signed token is missing', () => {
        return pactum.spec().get('/users').expectStatus(401);
      });

      it('should throw 401 if signed token is invalid', () => {
        return pactum
          .spec()
          .get('/users')
          .withHeaders({ Authorization: 'Bearer invalid_token' })
          .expectStatus(401);
      });

      it('should get all users', () => {
        return pactum
          .spec()
          .get('/users')
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .expectStatus(200)
          .expectBodyContains('username')
          .expectBodyContains('unreadCount')
          .toss();
      });
    });

    describe('Edit user', () => {
      const dto: EditUserDto = {
        firstName: 'John',
        email: 'test@gmail.com',
        password: '321',
      };

      it('should throw 401 if signed token is missing', () => {
        return pactum.spec().patch('/users').withBody(dto).expectStatus(401);
      });

      it('should throw 401 if signed token is invalid', () => {
        return pactum
          .spec()
          .patch('/users/')
          .withHeaders({ Authorization: 'Bearer invalid_token' })
          .withBody(dto)
          .expectStatus(401);
      });

      it('should throw 400 if email format is invalid', () => {
        const invalidDto: EditUserDto = {
          firstName: 'John',
          email: 'invalid email',
        };

        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .withBody(invalidDto)
          .expectStatus(400);
      });

      it('should throw 400 if password invalid', () => {
        const invalidDto: EditUserDto = {
          password: '',
        };

        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .withBody(invalidDto)
          .expectStatus(400);
      });

      it('should edit user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });

    describe('Delete user', () => {
      it('should throw 401 if signed token is missing', () => {
        return pactum.spec().delete('/users').expectStatus(401);
      });

      it('should throw 401 if signed token is invalid', () => {
        return pactum
          .spec()
          .delete('/users')
          .withHeaders({ Authorization: 'Bearer invalid_token' })
          .expectStatus(401);
      });

      it('should delete user', () => {
        return pactum
          .spec()
          .delete('/users')
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .expectStatus(200)
          .toss();
      });

      it('should throw 401 when trying to delete again', () => {
        return pactum
          .spec()
          .delete('/users')
          .withHeaders({ Authorization: 'Bearer $S{AccessToken}' })
          .expectStatus(401);
      });
    });
  });
});
