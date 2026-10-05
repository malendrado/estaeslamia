import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { Region } from '../../modules/regions/entities/region.entity';
import { Commune } from '../../modules/communes/entities/commune.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Service } from '../../modules/services/entities/service.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Provider } from '../../modules/providers/entities/provider.entity';
import { ProviderService } from '../../modules/providers/entities/provider-service.entity';
import { ProviderCommune } from '../../modules/providers/entities/provider-commune.entity';
import { ServiceRequest } from '../../modules/service-requests/entities/service-request.entity';
import { Lead } from '../../modules/leads/entities/lead.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { ProviderStatus } from '../../common/enums/provider-status.enum';
import { ServiceRequestStatus } from '../../common/enums/service-request-status.enum';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { REGIONS_DATA } from './data/regions-communes.data';
import { CATEGORIES_DATA } from './data/categories-services.data';
import { slugify } from './utils/slugify';

/**
 * Seed idempotente: se puede correr múltiples veces en desarrollo sin duplicar datos
 * (usa findOne-o-crea en vez de insert directo para las entidades catálogo).
 * Todos los nombres de personas/empresas ficticias son inventados, sin datos reales.
 */
async function run() {
  await AppDataSource.initialize();
  console.log('Conexión a base de datos establecida. Iniciando seed...');

  const regionRepo = AppDataSource.getRepository(Region);
  const communeRepo = AppDataSource.getRepository(Commune);
  const categoryRepo = AppDataSource.getRepository(Category);
  const serviceRepo = AppDataSource.getRepository(Service);
  const userRepo = AppDataSource.getRepository(User);
  const providerRepo = AppDataSource.getRepository(Provider);
  const providerServiceRepo = AppDataSource.getRepository(ProviderService);
  const providerCommuneRepo = AppDataSource.getRepository(ProviderCommune);
  const serviceRequestRepo = AppDataSource.getRepository(ServiceRequest);
  const leadRepo = AppDataSource.getRepository(Lead);

  // ---------- 1. Regiones y comunas ----------
  const communeByName = new Map<string, Commune>();
  for (const regionData of REGIONS_DATA) {
    let region = await regionRepo.findOne({ where: { code: regionData.code } });
    if (!region) {
      region = await regionRepo.save(regionRepo.create({ code: regionData.code, name: regionData.name }));
    }
    for (const communeName of regionData.communes) {
      const communeCode = `${regionData.code}-${slugify(communeName)}`;
      let commune = await communeRepo.findOne({ where: { code: communeCode } });
      if (!commune) {
        commune = await communeRepo.save(
          communeRepo.create({ name: communeName, code: communeCode, regionId: region.id }),
        );
      }
      communeByName.set(communeName, commune);
    }
  }
  console.log(`Regiones y comunas listas (${communeByName.size} comunas).`);

  // ---------- 2. Categorías y servicios ----------
  const serviceByName = new Map<string, Service>();
  for (const catData of CATEGORIES_DATA) {
    let category = await categoryRepo.findOne({ where: { slug: catData.slug } });
    if (!category) {
      category = await categoryRepo.save(
        categoryRepo.create({ name: catData.name, slug: catData.slug, icon: catData.icon }),
      );
    }
    for (const serviceName of catData.services) {
      const serviceSlug = slugify(serviceName);
      let service = await serviceRepo.findOne({ where: { slug: serviceSlug } });
      if (!service) {
        service = await serviceRepo.save(
          serviceRepo.create({ name: serviceName, slug: serviceSlug, categoryId: category.id }),
        );
      }
      serviceByName.set(serviceName, service);
    }
  }
  console.log(`Categorías y servicios listos (${serviceByName.size} servicios).`);

  // ---------- 3. Providers ficticios ----------
  const passwordHash = await bcrypt.hash('Demo1234!', 10);

  const demoProviders = [
    {
      businessName: 'Gasfitería Los Andes Ltda.',
      services: ['Gasfitería', 'Reparaciones'],
      communes: ['Valparaíso', 'Viña del Mar', 'Quilpué'],
    },
    {
      businessName: 'ElectroSur Instalaciones',
      services: ['Electricidad', 'Instalación de aire acondicionado'],
      communes: ['Quintero', 'Concón', 'Viña del Mar'],
    },
    {
      businessName: 'ClimaTotal Spa',
      services: ['Instalación de aire acondicionado', 'Electricidad'],
      communes: ['Quintero', 'Concón', 'Valparaíso', 'Casablanca'],
    },
    {
      businessName: 'Pinturas y Terminaciones Bicentenario',
      services: ['Pintura', 'Reparaciones'],
      communes: ['Santiago', 'Ñuñoa', 'Providencia'],
    },
    {
      businessName: 'Limpieza Express RM',
      services: ['Limpieza'],
      communes: ['Las Condes', 'Vitacura', 'Providencia', 'La Reina'],
    },
    {
      businessName: 'Cerrajería 24/7 Santiago',
      services: ['Cerrajería'],
      communes: ['Santiago', 'Estación Central', 'Independencia'],
    },
    {
      businessName: 'Jardines del Sur',
      services: ['Jardinería'],
      communes: ['Maipú', 'San Bernardo', 'Puente Alto'],
    },
    {
      businessName: 'Constructora Rengifo Hnos.',
      services: ['Remodelaciones', 'Construcción', 'Albañilería'],
      communes: ['Concepción', 'Talcahuano', 'San Pedro de la Paz'],
    },
    {
      businessName: 'Mecánica Full Motor',
      services: ['Mecánica', 'Neumáticos', 'Electricidad automotriz'],
      communes: ['Temuco', 'Villarrica'],
    },
    {
      businessName: 'Foco Estudio Fotografía y Video',
      services: ['Fotografía', 'Video'],
      communes: ['Santiago', 'Providencia', 'Ñuñoa'],
    },
    {
      businessName: 'WebNova Desarrollo Digital',
      services: ['Desarrollo web', 'Soporte informático', 'Redes'],
      communes: ['Santiago', 'Las Condes', 'Providencia'],
    },
  ];

  const createdProviders: Provider[] = [];

  for (let i = 0; i < demoProviders.length; i++) {
    const demo = demoProviders[i];
    const email = `contacto${i + 1}@${slugify(demo.businessName).slice(0, 20)}.cl`;

    let user = await userRepo.findOne({ where: { email } });
    if (!user) {
      user = await userRepo.save(
        userRepo.create({
          email,
          passwordHash,
          name: demo.businessName,
          phone: `+56 9 ${8000_0000 + i}`.replace(/_/g, ''),
          role: UserRole.PROVIDER,
          isActive: true,
        }),
      );
    }

    let provider = await providerRepo.findOne({ where: { userId: user.id } });
    if (!provider) {
      provider = await providerRepo.save(
        providerRepo.create({
          userId: user.id,
          businessName: demo.businessName,
          description: `Empresa ficticia de demostración especializada en ${demo.services.join(', ').toLowerCase()}.`,
          phone: user.phone as string,
          email,
          whatsapp: user.phone as string,
          status: ProviderStatus.ACTIVE,
        }),
      );

      for (const serviceName of demo.services) {
        const service = serviceByName.get(serviceName);
        if (service) {
          await providerServiceRepo.save(
            providerServiceRepo.create({ providerId: provider.id, serviceId: service.id }),
          );
        }
      }
      for (const communeName of demo.communes) {
        const commune = communeByName.get(communeName);
        if (commune) {
          await providerCommuneRepo.save(
            providerCommuneRepo.create({ providerId: provider.id, communeId: commune.id }),
          );
        }
      }
    }
    createdProviders.push(provider);
  }
  console.log(`Providers ficticios listos (${createdProviders.length}).`);

  // ---------- 3.5. Admin de demostración ----------
  const adminEmail = 'admin@estaeslamia.cl';
  let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await userRepo.save(
      userRepo.create({
        email: adminEmail,
        passwordHash, // mismo hash de 'Demo1234!' generado más arriba para los providers
        name: 'Admin EstaEsLaMía',
        phone: '+56 9 0000 0000',
        role: UserRole.ADMIN,
        isActive: true,
      }),
    );
  }
  console.log(`Admin de demostración listo (${adminEmail} / Demo1234!).`);

  // ---------- 4. Customers ficticios ----------
  const demoCustomers = [
    { name: 'Cliente Demo Uno', email: 'cliente.demo1@example.cl', phone: '+56 9 1111 1111' },
    { name: 'Cliente Demo Dos', email: 'cliente.demo2@example.cl', phone: '+56 9 2222 2222' },
    { name: 'Cliente Demo Tres', email: 'cliente.demo3@example.cl', phone: '+56 9 3333 3333' },
  ];
  const createdCustomers: User[] = [];
  for (const c of demoCustomers) {
    let user = await userRepo.findOne({ where: { email: c.email } });
    if (!user) {
      user = await userRepo.save(
        userRepo.create({
          email: c.email,
          passwordHash: null,
          name: c.name,
          phone: c.phone,
          role: UserRole.CUSTOMER,
          isActive: false, // customer "silencioso": no se ha registrado formalmente
        }),
      );
    }
    createdCustomers.push(user);
  }
  console.log(`Customers ficticios listos (${createdCustomers.length}).`);

  // ---------- 5. Service Requests + Leads de ejemplo ----------
  const quintero = communeByName.get('Quintero');
  const santiago = communeByName.get('Santiago');
  const climatizacion = serviceByName.get('Instalación de aire acondicionado');
  const gasfiteria = serviceByName.get('Gasfitería');
  const categoriaHogar = await categoryRepo.findOne({ where: { slug: 'hogar' } });

  if (quintero && climatizacion && categoriaHogar && createdCustomers[0]) {
    const existingRequest = await serviceRequestRepo.findOne({
      where: { customerId: createdCustomers[0].id, serviceId: climatizacion.id, communeId: quintero.id },
    });

    const request =
      existingRequest ??
      (await serviceRequestRepo.save(
        serviceRequestRepo.create({
          customerId: createdCustomers[0].id,
          categoryId: categoriaHogar.id,
          serviceId: climatizacion.id,
          communeId: quintero.id,
          description: 'Necesito instalar 2 equipos de aire acondicionado en dormitorios, ideal antes de verano.',
          address: null,
          preferredDate: '2026-09-15',
          budgetMin: 600000,
          budgetMax: 900000,
          contactName: createdCustomers[0].name,
          contactEmail: createdCustomers[0].email,
          contactPhone: createdCustomers[0].phone ?? '+56 9 1111 1111',
          consentAcceptedAt: new Date(),
          status: ServiceRequestStatus.MATCHED,
        }),
      ));

    // Matching simple: providers activos que ofrecen el servicio en la comuna
    const matchingProviderNames = ['ElectroSur Instalaciones', 'ClimaTotal Spa'];
    for (const name of matchingProviderNames) {
      const provider = createdProviders.find((p) => p.businessName === name);
      if (!provider) continue;
      const existingLead = await leadRepo.findOne({
        where: { serviceRequestId: request.id, providerId: provider.id },
      });
      if (!existingLead) {
        await leadRepo.save(
          leadRepo.create({
            serviceRequestId: request.id,
            providerId: provider.id,
            status: LeadStatus.DELIVERED,
            price: 0,
            isPaid: false,
          }),
        );
      }
    }
  }

  if (santiago && gasfiteria && categoriaHogar && createdCustomers[1]) {
    const existingRequest2 = await serviceRequestRepo.findOne({
      where: { customerId: createdCustomers[1].id, serviceId: gasfiteria.id, communeId: santiago.id },
    });
    if (!existingRequest2) {
      const request2 = await serviceRequestRepo.save(
        serviceRequestRepo.create({
          customerId: createdCustomers[1].id,
          categoryId: categoriaHogar.id,
          serviceId: gasfiteria.id,
          communeId: santiago.id,
          description: 'Filtración de agua bajo el lavaplatos de la cocina, necesito revisión urgente.',
          preferredDate: null,
          budgetMin: null,
          budgetMax: null,
          contactName: createdCustomers[1].name,
          contactEmail: createdCustomers[1].email,
          contactPhone: createdCustomers[1].phone ?? '+56 9 2222 2222',
          consentAcceptedAt: new Date(),
          status: ServiceRequestStatus.SUBMITTED,
        }),
      );
      console.log(`ServiceRequest de ejemplo creada sin matches todavía: ${request2.id}`);
    }
  }

  console.log('Seed completado exitosamente.');
  await AppDataSource.destroy();
}

run().catch((error) => {
  console.error('Error ejecutando el seed:', error);
  process.exit(1);
});
