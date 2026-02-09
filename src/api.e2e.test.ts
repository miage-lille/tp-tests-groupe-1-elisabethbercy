import supertest from "supertest";
import { TestServerFixture } from "./tests/fixture";

describe('Webinar Routes E2E', () => {
    // this class is for testing the routes of the application, 
    // it will start a test server and a test database, 
    // and it will allow us to make HTTP requests to the server and check the responses. 
    // It will also allow us to reset the database before each
    //  test to ensure that we have a clean state.

    //rappel : fixture est une classe qui va nous permettre de gérer l'état de notre serveur
    //  et de notre base de données pendant les tests d'intégration. 
    // Elle va démarrer un conteneur PostgreSQL, initialiser Prisma, 
    // et démarrer le serveur Fastify () avec les routes de l'application.
    //  Elle va aussi fournir des méthodes pour accéder au client Prisma, au serveur, 
    // et au conteneur d'application, ainsi que pour réinitialiser la base de données 
    // entre les tests et arrêter le serveur à la fin des tests.

  let fixture: TestServerFixture;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });
  
    it('should update webinar seats', async () => {
        // ARRANGE
        const prisma = fixture.getPrismaClient();
        const server = fixture.getServer();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 5);
        const endDate = new Date(startDate);
        //sethours used here to avoid validation error of end date being
        // before start date, we set it 1 hour after start date
        endDate.setHours(endDate.getHours() + 1);


        const webinar = await prisma.webinar.create({
        data: {
            id: 'test-webinar',
            title: 'Webinar Test',
            seats: 10,
            startDate: new Date(),
            endDate: new Date(),
            organizerId: 'test-user',
        },
        });

        // ACT
        const response = await supertest(server)
        .post(`/webinars/${webinar.id}/seats`)
        .send({ seats: '30' })
        .expect(200);

        // ASSERT
        expect(response.body).toEqual({ message: 'Seats updated' });

        const updatedWebinar = await prisma.webinar.findUnique({
        where: { id: webinar.id },
        });
        expect(updatedWebinar?.seats).toBe(30);
    });
    //===========>>>>>>>>> 404 error si le webinar n'existe pas,

    it('should return 404 when webinar not found', async () => {
    // ARRANGE
    const server = fixture.getServer();

    // ACT
    const response = await supertest(server)
      .post(`/webinars/unknown-id/seats`)
      .send({ seats: '30' })
      .expect(404);

    // ASSERT
    expect(response.body).toEqual({ error: 'Webinar not found' });
  });



  //===========>>>>>>>>> 401 error quand l'utilisateur n'est pas l'organisateur du webinar,

  it('should return 401 when user is not the organizer', async () => {
    // ARRANGE
    const prisma = fixture.getPrismaClient();
    const server = fixture.getServer();

    // On crée un webinaire dont l'organisateur est 'other-user'
    // Rappel :utilisateur courant à 'test-user'
    const webinar = await prisma.webinar.create({
      data: {
        id: 'webinar-not-organizer',
        title: 'Webinar Test',
        seats: 10,
        startDate: new Date(),
        endDate: new Date(),
        organizerId: 'other-user', 
      },
    });

    // ACT
    const response = await supertest(server)
      .post(`/webinars/${webinar.id}/seats`)
      .send({ seats: '30' })
      .expect(401);

    // ASSERT
    expect(response.body).toEqual({ error: 'User is not allowed to update this webinar' });
  });



});

describe('Feature: Organize Webinar E2E', () => {
  let fixture: TestServerFixture;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  it('should organize a webinar', async () => {
    // ARRANGE
    const server = fixture.getServer();
    const prisma = fixture.getPrismaClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 5);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    // rappel payload est l'objet que nous allons envoyer dans le corps de la requête 
    // pour créer un nouveau webinaire.
    const payload = {
      title: 'My New Webinar',
      seats: 50,
      startDate: startDate,
      endDate: endDate,
    };

    // ACT
    const response = await supertest(server)
      .post('/webinars')
      .send(payload)
      .expect(201);

    // ASSERT
    expect(response.body).toHaveProperty('id');
    
    // Vérification en base de données
    const createdWebinar = await prisma.webinar.findUnique({
      where: { id: response.body.id },
    });
    expect(createdWebinar).toBeDefined();
    expect(createdWebinar?.title).toBe('My New Webinar');
    expect(createdWebinar?.organizerId).toBe('test-user'); // L'user hardcodé dans la route
  });
});