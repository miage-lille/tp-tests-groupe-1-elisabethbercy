// Tests unitaires
import { InMemoryWebinarRepository } from "src/webinars/adapters/webinar-repository.in-memory";
import { Webinar } from "src/webinars/entities/webinar.entity";
import { ChangeSeats } from "src/webinars/use-cases/change-seats";
import { testUser } from "src/users/tests/user-seeds";
import { WebinarNotFoundException } from "src/webinars/exceptions/webinar-not-found";
import { WebinarNotOrganizerException } from "src/webinars/exceptions/webinar-not-organizer";
import { WebinarReduceSeatsException } from "src/webinars/exceptions/webinar-reduce-seats";
import { WebinarTooManySeatsException } from "src/webinars/exceptions/webinar-too-many-seats";
import { User } from "src/users/entities/user.entity";


describe('Feature : Change seats', () => {
  // Initialisation de nos tests, boilerplates...
    let webinarRepository: InMemoryWebinarRepository;
    let useCase: ChangeSeats;

    const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: testUser.alice.props.id,
        title: 'Webinar title',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-01T01:00:00Z'),
        seats: 100,
    });


    beforeEach(() => {
        webinarRepository = new InMemoryWebinarRepository([webinar]);
        useCase = new ChangeSeats(webinarRepository);
    });

  describe('Scenario: Happy path', () => {
    // Code commun à notre scénario : payload...
    // rappel : payload
     const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 200,
    };

  it('should change the number of seats for a webinar', async () => {
    // ACT
    await useCase.execute(payload);
    // ASSERT
    const updatedWebinar = await webinarRepository.findById('webinar-id');
    expect(updatedWebinar?.props.seats).toEqual(200);
  });


  });

  describe('Scenario: webinar does not exist', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'unknown-webinar-id',
      seats: 200,
    };

    it('should fail', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(
        WebinarNotFoundException,
      );
    });
  });

  //scenario 2 

  describe('Scenario: user is not the organizer', () => {
    const payload = {
      user: new User({
        id: 'user-bob',
        email: 'bob@example.com',
        password: 'password',
      }),
      webinarId: 'webinar-id',
      seats: 200,
    };

    it('should fail', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(
        WebinarNotOrganizerException,
      );
    });
  });

  //scenario 3
  describe('Scenario: too many seats', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 1001,
    };

    it('should fail', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(
        WebinarTooManySeatsException,
      );
    });
  });



});

  
