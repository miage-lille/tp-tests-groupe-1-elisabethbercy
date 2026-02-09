import { Webinar } from 'src/webinars/entities/webinar.entity';
// Test d'intégration
// C. Ecriture de notre premier test d'intégration

import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';

const asyncExec = promisify(exec);

describe('PrismaWebinarRepository', () => {
  let container: StartedPostgreSqlContainer;
  let prismaClient: PrismaClient;
  let repository: PrismaWebinarRepository;

  beforeAll(async () => {
  // Connect to database
  container = await new PostgreSqlContainer()
        .withDatabase('test_db')
        .withUsername('user_test')
        .withPassword('password_test')
        .withExposedPorts(5432)
        .start();

        const dbUrl = container.getConnectionUri();
        prismaClient = new PrismaClient({
            datasources: {
            db: { url: dbUrl },
            },
        });

        // Run migrations to populate the database
        //await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);
        //for windows
        await asyncExec(`npx prisma migrate deploy`, {
          env: {
            ...process.env,
            DATABASE_URL: dbUrl,
          },
        });

        return prismaClient.$connect();

        
    }, 60000);
    
    beforeEach(async () => {
        repository = new PrismaWebinarRepository(prismaClient);
        await prismaClient.webinar.deleteMany();
        await prismaClient.$executeRawUnsafe('DELETE FROM "Webinar" CASCADE');
    });

    afterAll(async () => {
    // Sécurité : on n'arrête que si ça a bien démarré
    if (container) {
        await container.stop({ timeout: 1000 });
    }
    if (prismaClient) {
        await prismaClient.$disconnect();
    }
   });

    describe('Scenario : repository.create', () => {
        it('should create a webinar', async () => {
            // ARRANGE
            const webinar = new Webinar({
            id: 'webinar-id',
            organizerId: 'organizer-id',
            title: 'Webinar title',
            startDate: new Date('2022-01-01T00:00:00Z'),
            endDate: new Date('2022-01-01T01:00:00Z'),
            seats: 100,
            });

            // ACT
            await repository.create(webinar);

            // ASSERT
            const maybeWebinar = await prismaClient.webinar.findUnique({
            where: { id: 'webinar-id' },
            });
            expect(maybeWebinar).toEqual({
            id: 'webinar-id',
            organizerId: 'organizer-id',
            title: 'Webinar title',
            startDate: new Date('2022-01-01T00:00:00Z'),
            endDate: new Date('2022-01-01T01:00:00Z'),
            seats: 100,
            });
        });
    });

   describe('Scenario : repository.findById', () => {
    it('should find a webinar', async () => {
      // ARRANGE
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Webinar title',
        startDate: new Date('2022-01-10T00:00:00Z'),
        endDate: new Date('2022-01-10T01:00:00Z'),
        seats: 100,
      });
      // create the webinar
      await repository.create(webinar);

      // ACT use repo
      const foundWebinar = await repository.findById('webinar-id');

      // ASSERT
      // Note : foundWebinar est une Entity, on compare ses props ou l'objet entier
      expect(foundWebinar?.props).toEqual({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Webinar title',
        startDate: new Date('2022-01-10T00:00:00Z'),
        endDate: new Date('2022-01-10T01:00:00Z'),
        seats: 100,
      });
    });
  });

  describe('Scenario : repository.update', () => {
    it('should update a webinar', async () => {
      // ARRANGE
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Webinar title',
        startDate: new Date('2022-01-10T00:00:00Z'),
        endDate: new Date('2022-01-10T01:00:00Z'),
        seats: 100,
      });
      
      await repository.create(webinar);

      webinar.update({ seats: 200 });

      // ACT
      await repository.update(webinar);

      // ASSERT on verifie la modification
      const updatedWebinar = await prismaClient.webinar.findUnique({
        where: { id: 'webinar-id' },
      });

      expect(updatedWebinar?.seats).toBe(200);
    });
  });

});
