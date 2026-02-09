import { TestServerFixture } from '../../tests/fixture';
import { OrganizeWebinars } from './organize-webinar';

describe('Feature: Organize Webinar (Integration)', () => {
  let fixture: TestServerFixture;
  let useCase: OrganizeWebinars;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
    useCase = fixture.getAppContainer().getOrganizeWebinarsUseCase();
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  it('should persist the webinar in the database', async () => {
    // ARRANGE

    // vu qu'on utilise la date du jour pour startdate on doit s'assurer que la date du jour 
    // est avant la date de début du webinar pour éviter les erreurs de validation
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 5);

    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const request = {
      userId: 'organizer-id',
      title: 'Integration Test Webinar',
      seats: 100,
      startDate: startDate,
      endDate: endDate,
    };

    // ACT
    const response = await useCase.execute(request);

    // ASSERT
    const prisma = fixture.getPrismaClient();
    const savedWebinar = await prisma.webinar.findUnique({
      where: { id: response.id },
    });

    expect(savedWebinar).not.toBeNull();
    expect(savedWebinar?.title).toEqual('Integration Test Webinar');
    expect(savedWebinar?.seats).toEqual(100);
  });
});