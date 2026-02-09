import { FastifyInstance } from 'fastify';
import { AppContainer } from 'src/container';
import { User } from 'src/users/entities/user.entity';
import { WebinarNotFoundException } from 'src/webinars/exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from 'src/webinars/exceptions/webinar-not-organizer';
import { OrganizeWebinars } from './use-cases/organize-webinar';
import { WebinarDatesTooSoonException } from './exceptions/webinar-dates-too-soon';
import { WebinarNotEnoughSeatsException } from './exceptions/webinar-not-enough-seats';
import { WebinarTooManySeatsException } from './exceptions/webinar-too-many-seats';

export async function webinarRoutes(
  fastify: FastifyInstance,
  container: AppContainer,
) {
  const changeSeatsUseCase = container.getChangeSeatsUseCase();
  const organizeWebinarsUseCase = container.getOrganizeWebinarsUseCase();

  //fastify is a web framework for Node.js, it allows us to define routes and their handlers. 
  // Here we define two routes: one for changing the number of seats of a webinar, 
  // and another for organizing a new webinar.
  fastify.post<{
    Body: { seats: string };
    Params: { id: string };
  }>('/webinars/:id/seats', {}, async (request, reply) => {
    const changeSeatsCommand = {
      seats: parseInt(request.body.seats, 10),
      webinarId: request.params.id,
      user: new User({
        id: 'test-user',
        email: 'test@test.com',
        password: 'fake',
      }),
    };

    try {
      await changeSeatsUseCase.execute(changeSeatsCommand);
      reply.status(200).send({ message: 'Seats updated' });
    } catch (err) {
      if (err instanceof WebinarNotFoundException) {
        return reply.status(404).send({ error: err.message });
      }
      if (err instanceof WebinarNotOrganizerException) {
        return reply.status(401).send({ error: err.message });
      }
      reply.status(500).send({ error: 'An error occurred' });
    }
  });

  // organiser un evenement, POST /webinars
  fastify.post<{
    Body: { title: string; 
    seats: number; 
    startDate: string; 
    endDate: string };
  }>('/webinars', {}, async (request, reply) => {
    const user = new User({
      id: 'test-user',
      email: 'test@test.com',
      password: 'mysecretpassword',
    });

    try {
      const response = await organizeWebinarsUseCase.execute({
        userId: user.props.id,
        title: request.body.title,
        seats: request.body.seats,
        startDate: new Date(request.body.startDate),
        endDate: new Date(request.body.endDate),
      });
      reply.status(201).send(response);
    } catch (err) {
      // Gestion des erreurs 
      if (err instanceof WebinarDatesTooSoonException) {
        return reply.status(400).send({ error: err.message });
      }
      if (err instanceof WebinarNotEnoughSeatsException) {
        return reply.status(400).send({ error: err.message });
      }
      if (err instanceof WebinarTooManySeatsException) {
        return reply.status(400).send({ error: err.message });
      }
      // Erreur par défaut
      reply.status(500).send({ error: 'An error occurred' });
    }
  });
}
