import { PrismaClient } from '@prisma/client';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';
import { ChangeSeats } from 'src/webinars/use-cases/change-seats';
import { OrganizeWebinars } from './webinars/use-cases/organize-webinar';
import { RealIdGenerator } from './core/adapters/real-id-generator';
import { RealDateGenerator } from './core/adapters/real-date-generator';

export class AppContainer {
  //appContainer est une classe qui va servir à stocker les instances de nos dépendances, comme le client Prisma, les repositories et les use cases. Cela nous permettra de les partager facilement entre les différentes 
  // parties de notre application, comme les routes et les tests d'intégration.
  
  private prismaClient!: PrismaClient;
  private webinarRepository!: PrismaWebinarRepository;
  private changeSeatsUseCase!: ChangeSeats;
  private organizeWebinarsUseCase!: OrganizeWebinars;

  init(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
    this.webinarRepository = new PrismaWebinarRepository(this.prismaClient);
    this.changeSeatsUseCase = new ChangeSeats(this.webinarRepository);

    this.organizeWebinarsUseCase = new OrganizeWebinars(
      this.webinarRepository,
      new RealIdGenerator(),
      new RealDateGenerator(),
    );
  }

  getPrismaClient() {
    return this.prismaClient;
  }

  getChangeSeatsUseCase() {
    return this.changeSeatsUseCase;
  }

  //used here to get the use case in the integration test of organize webinar
  getOrganizeWebinarsUseCase() {
    return this.organizeWebinarsUseCase;
  }
}

export const container = new AppContainer();