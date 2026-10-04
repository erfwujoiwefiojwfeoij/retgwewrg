const path = require('path');

require(path.join(__dirname, '../backend/node_modules/dotenv')).config({
  path: path.join(__dirname, '../backend/.env'),
});

const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));

const prisma = new PrismaClient();

const photo = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const COVERS = [
  '1560066984-138dadb4c035',
  '1522337360788-8b13dee7a37e',
  '1633681926022-84c23e8cb2d6',
  '1519415387722-a1c3bbef716c',
  '1521590832167-7bcbfaa6381f',
  '1487412947147-5cebf100ffc2',
  '1516975080664-ed2fc6a32937',
  '1600948836101-f9ffda59d250',
  '1562322140-8baeececf3df',
  '1522335789203-aabd1fc54bc9',
  '1519415510236-718bdfcd89c8',
  '1616394584738-fc6e612e71b9',
];

const PORTRAITS = [
  '1494790108377-be9c29b29330',
  '1438761681033-6461ffad8d80',
  '1544005313-94ddf0286df2',
  '1534528741775-53994a69daeb',
  '1524504388940-b1c1722653e1',
  '1531123897727-8f129e1688ce',
  '1529626455594-4ff0802cfb7e',
  '1488426862026-3ee34a7d66df',
  '1531746020798-e6953c6e8e04',
  '1487412720507-e7ab37603c6f',
  '1508214751196-bcfd4ca60f91',
  '1525134479668-1bee5c7c6845',
  '1500648767791-00dcc994a43e',
  '1506794778202-cad84cf45f1d',
  '1507003211169-0a1dd7228f2d',
  '1463453091185-61582044d556',
  '1548142813-c348350df52b',
  '1521119989659-a83eee488004',
  '1517841905240-472988babdf9',
  '1524502397800-2eeaad7c3fe5',
  '1539571696357-5a69c17a67c6',
  '1502823403499-6ccfcf4fb453',
  '1499952127939-9bbf5af6c51c',
  '1500917293891-ef795e70e1f6',
  '1525134479668-1bee5c7c6845',
  '1487412720507-e7ab37603c6f',
  '1534528741775-53994a69daeb',
  '1529626455594-4ff0802cfb7e',
  '1544005313-94ddf0286df2',
  '1494790108377-be9c29b29330',
  '1438761681033-6461ffad8d80',
  '1500648767791-00dcc994a43e',
];

const FEM_FIRST = ['Алина', 'Мария', 'Ева', 'София', 'Кира', 'Полина', 'Дарья', 'Вера', 'Ника', 'Лера', 'Ольга', 'Таисия', 'Мила', 'Ася', 'Нина', 'Катя'];
const MALE_FIRST = ['Илья', 'Марк', 'Артём', 'Лев', 'Глеб', 'Тимур', 'Егор'];
const FEM_LAST = ['Морозова', 'Соколова', 'Волкова', 'Лебедева', 'Кузнецова', 'Орлова', 'Белова', 'Новикова', 'Фомина', 'Крылова', 'Егорова', 'Павлова', 'Семёнова', 'Тихонова', 'Калинина', 'Романова'];
const MALE_LAST = ['Иванов', 'Петров', 'Смирнов', 'Козлов', 'Орлов', 'Зайцев'];
const CLIENT_FIRST = ['Анна', 'Елена', 'Ольга', 'Ирина', 'Наталья', 'Марина', 'Светлана', 'Юлия', 'Александра', 'Виктория', 'Ксения', 'Дарья', 'Павел', 'Андрей', 'Сергей', 'Никита', 'Олег', 'Денис'];
const CLIENT_LAST = ['Иванова', 'Петрова', 'Сидорова', 'Кузьмина', 'Попова', 'Васильева', 'Смирнова', 'Михайлова', 'Фёдорова', 'Алексеева', 'Степанов', 'Николаев', 'Орлов', 'Зайцев'];

const CITIES = [
  { name: 'Москва', lat: 55.7558, lng: 37.6173 },
  { name: 'Санкт-Петербург', lat: 59.9343, lng: 30.3351 },
  { name: 'Казань', lat: 55.7887, lng: 49.1221 },
];

const SALONS = [
  ['Ателье Северное', 'Тихий салон у Патриарших: свет, дерево и точное расписание.', 'Москва', 'Малый Козихинский пер., 8'],
  ['Студия Линия', 'Стрижки и цвет без лишнего шума. Мастера работают по записи.', 'Москва', 'ул. Покровка, 17'],
  ['Дом Морозовой', 'Камерный дом красоты: ногти, брови и уход за кожей.', 'Москва', 'ул. Остоженка, 21'],
  ['Кабинет на Патриарших', 'Небольшой кабинет с сильной косметологией.', 'Москва', 'Бол. Патриарший пер., 4'],
  ['Forma', 'Барбер и мужской уход. Короткие визиты, ясное меню.', 'Москва', 'ул. Мясницкая, 24'],
  ['Тихая гавань', 'Спа-ритуалы и массаж лица в полупустом зале.', 'Санкт-Петербург', 'наб. реки Фонтанки, 54'],
  ['Nolita', 'Цвет, укладки и вечерний макияж.', 'Санкт-Петербург', 'ул. Рубинштейна, 11'],
  ['Белая комната', 'Ногтевая студия со светлым залом и двумя мастерами.', 'Санкт-Петербург', 'Литейный пр., 36'],
  ['Мастерская Луны', 'Брови, ресницы и мягкий макияж.', 'Казань', 'ул. Баумана, 42'],
  ['Сад', 'Уход за кожей и расслабляющие протоколы.', 'Казань', 'ул. Муштари, 9'],
  ['Второй этаж', 'Салон на втором этаже старого дома. Волосы и ногти.', 'Москва', 'ул. Пятницкая, 16'],
  ['Atelier 14', 'Короткое меню: стрижка, уход, укладка.', 'Санкт-Петербург', 'Каменноостровский пр., 14'],
];

const CATEGORIES = [
  ['hair', 'Волосы', 'Hair'],
  ['nails', 'Ногти', 'Nails'],
  ['brows', 'Брови', 'Brows'],
  ['lashes', 'Ресницы', 'Lashes'],
  ['skin', 'Кожа', 'Skin'],
  ['massage', 'Массаж', 'Massage'],
  ['makeup', 'Макияж', 'Makeup'],
  ['barber', 'Барбер', 'Barber'],
];

const SERVICE_BANK = {
  hair: [
    ['Женская стрижка', 60, 3500],
    ['Окрашивание', 150, 8900],
    ['Укладка', 45, 2800],
    ['Уход за волосами', 50, 3200],
  ],
  nails: [
    ['Маникюр', 60, 2500],
    ['Педикюр', 75, 3200],
    ['Покрытие гель-лаком', 30, 1500],
  ],
  brows: [
    ['Архитектура бровей', 45, 2200],
    ['Окрашивание бровей', 30, 1600],
  ],
  lashes: [
    ['Ламинирование ресниц', 70, 3900],
    ['Классическое наращивание', 120, 5400],
  ],
  skin: [
    ['Чистка лица', 80, 4500],
    ['Уходовый протокол', 60, 5200],
  ],
  massage: [
    ['Массаж лица', 50, 3400],
    ['Массаж шеи и плеч', 40, 2900],
  ],
  makeup: [
    ['Дневной макияж', 50, 4000],
    ['Вечерний макияж', 70, 5500],
  ],
  barber: [
    ['Мужская стрижка', 45, 2200],
    ['Стрижка и борода', 60, 2800],
  ],
};

const SALON_MENU = ['hair', 'nails', 'brows', 'skin', 'hair', 'massage', 'makeup', 'nails', 'lashes', 'skin', 'hair', 'barber'];

function slugify(value) {
  const map = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  return value.toLowerCase().split('').map((ch) => map[ch] ?? ch).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function dateShift(days) {
  const now = new Date();
  const moscow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  moscow.setUTCDate(moscow.getUTCDate() + days);
  return moscow.toISOString().slice(0, 10);
}

function at(date, time) {
  return new Date(`${date}T${time}:00+03:00`);
}

function pick(list, index) {
  return list[index % list.length];
}

async function main() {
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.dayOff.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.masterService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.master.deleteMany();
  await prisma.salonClient.deleteMany();
  await prisma.salonMember.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.salonBranch.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.emailToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('LuneaDemo2026!', 10);

  const categories = {};
  for (const [slug, name, nameEn] of CATEGORIES) {
    categories[slug] = await prisma.serviceCategory.create({ data: { slug, name, nameEn } });
  }

  const owner = await prisma.user.create({
    data: {
      email: 'owner@lunea.test',
      passwordHash,
      role: 'SALON_OWNER',
      emailVerified: true,
      profile: { create: { firstName: 'Вера', lastName: 'Северная', phone: '+7 495 120-00-01', city: 'Москва' } },
    },
  });
  const demoMasterUser = await prisma.user.create({
    data: {
      email: 'master@lunea.test',
      passwordHash,
      role: 'MASTER',
      emailVerified: true,
      profile: { create: { firstName: 'Алина', lastName: 'Морозова', phone: '+7 916 200-11-22', city: 'Москва' } },
    },
  });
  const demoClient = await prisma.user.create({
    data: {
      email: 'client@lunea.test',
      passwordHash,
      role: 'CLIENT',
      emailVerified: true,
      profile: { create: { firstName: 'Анна', lastName: 'Иванова', phone: '+7 903 111-22-33', city: 'Москва' } },
    },
  });
  await prisma.user.create({
    data: {
      email: 'admin@lunea.test',
      passwordHash,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      profile: { create: { firstName: 'Админ', lastName: 'LUNEA', city: 'Москва' } },
    },
  });

  const clients = [demoClient];
  for (let i = 0; i < 100; i += 1) {
    const first = pick(CLIENT_FIRST, i);
    const last = pick(CLIENT_LAST, i * 3);
    clients.push(await prisma.user.create({
      data: {
        email: `client${i + 1}@lunea.test`,
        passwordHash,
        role: 'CLIENT',
        emailVerified: true,
        profile: { create: { firstName: first, lastName: last, phone: `+7 900 ${String(100 + i).padStart(3, '0')}-${String(10 + (i % 80)).padStart(2, '0')}-${String(10 + (i % 70)).padStart(2, '0')}`, city: CITIES[i % 3].name } },
      },
    }));
  }

  const salons = [];
  for (let i = 0; i < SALONS.length; i += 1) {
    const [name, description, cityName, address] = SALONS[i];
    const city = CITIES.find((item) => item.name === cityName);
    const cover = photo(COVERS[i]);
    const salon = await prisma.salon.create({
      data: {
        slug: slugify(name),
        name,
        description,
        cover,
        logo: cover,
        gallery: [photo(COVERS[i], 900), photo(COVERS[(i + 3) % COVERS.length], 900), photo(COVERS[(i + 6) % COVERS.length], 900)],
        address,
        city: cityName,
        lat: city.lat + (i % 5) * 0.01,
        lng: city.lng + (i % 4) * 0.012,
        phone: `+7 495 ${100 + i}-${20 + i}-${30 + i}`,
        verified: i % 5 !== 4,
        ownerId: i === 0 ? owner.id : (await prisma.user.create({
          data: {
            email: `owner${i}@lunea.test`,
            passwordHash,
            role: 'SALON_OWNER',
            emailVerified: true,
            profile: { create: { firstName: pick(FEM_FIRST, i), lastName: pick(FEM_LAST, i + 2), city: cityName } },
          },
        })).id,
        subscription: { create: { plan: 'start', status: 'TRIAL' } },
      },
    });
    await prisma.workingHour.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        salonId: salon.id,
        dayOfWeek,
        startTime: '10:00',
        endTime: '21:00',
        breakStart: dayOfWeek === 0 ? null : '14:00',
        breakEnd: dayOfWeek === 0 ? null : '15:00',
        isOff: dayOfWeek === 0,
      })),
    });
    if (i % 3 === 0) {
      await prisma.salonBranch.create({
        data: {
          salonId: salon.id,
          name: `${name} · второй зал`,
          address: `${address}, эт. 2`,
          city: cityName,
          phone: salon.phone,
          lat: salon.lat,
          lng: salon.lng,
        },
      });
    }
    salons.push(salon);
  }

  const specs = ['Колорист', 'Мастер маникюра', 'Бровист', 'Косметолог', 'Барбер', 'Визажист', 'Массажист', 'Стилист'];
  const masters = [];
  let portrait = 0;
  for (let s = 0; s < salons.length; s += 1) {
    const count = s < 6 ? 3 : 2;
    for (let m = 0; m < count; m += 1) {
      const female = portrait % 5 !== 0;
      const firstName = s === 0 && m === 0 ? 'Алина' : pick(female ? FEM_FIRST : MALE_FIRST, portrait);
      const lastName = s === 0 && m === 0 ? 'Морозова' : pick(female ? FEM_LAST : MALE_LAST, portrait + 1);
      const master = await prisma.master.create({
        data: {
          slug: slugify(`${firstName}-${lastName}-${s}-${m}`),
          userId: s === 0 && m === 0 ? demoMasterUser.id : null,
          salonId: salons[s].id,
          firstName,
          lastName,
          photo: photo(PORTRAITS[portrait % PORTRAITS.length], 800),
          bio: `${firstName} работает спокойно и точно. В записи видно, сколько длится услуга и какое окно свободно.`,
          specialization: specs[(s + m) % specs.length],
          experienceYears: 2 + ((s + m) % 12),
          gender: female ? 'FEMALE' : 'MALE',
          verified: portrait % 4 !== 3,
          city: salons[s].city,
          instagram: `${slugify(firstName)}.studio`,
        },
      });
      await prisma.workingHour.createMany({
        data: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          masterId: master.id,
          dayOfWeek,
          startTime: m === 1 ? '12:00' : '10:00',
          endTime: m === 1 ? '21:00' : '20:00',
          breakStart: '14:00',
          breakEnd: '15:00',
          isOff: dayOfWeek === 0 && m !== 2,
        })),
      });
      masters.push(master);
      portrait += 1;
    }
  }

  while (masters.length < 32) {
    const index = masters.length;
    const firstName = pick(FEM_FIRST, index + 3);
    const lastName = pick(FEM_LAST, index + 5);
    const city = CITIES[index % 3];
    const master = await prisma.master.create({
      data: {
        slug: slugify(`${firstName}-${lastName}-solo-${index}`),
        firstName,
        lastName,
        photo: photo(PORTRAITS[index % PORTRAITS.length], 800),
        bio: 'Независимый мастер. Принимает только по записи LUNEA.',
        specialization: specs[index % specs.length],
        experienceYears: 4 + (index % 8),
        gender: 'FEMALE',
        verified: true,
        city: city.name,
        instagram: `${slugify(firstName)}.private`,
      },
    });
    await prisma.workingHour.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        masterId: master.id,
        dayOfWeek,
        startTime: '11:00',
        endTime: '19:00',
        breakStart: '14:30',
        breakEnd: '15:00',
        isOff: dayOfWeek === 0 || dayOfWeek === 6,
      })),
    });
    masters.push(master);
  }

  const tomorrow = dateShift(1);
  await prisma.dayOff.create({
    data: { masterId: masters[1].id, date: new Date(`${tomorrow}T00:00:00.000Z`), reason: 'Выходной' },
  });

  const services = [];
  for (let s = 0; s < salons.length; s += 1) {
    const keys = [SALON_MENU[s], s % 2 === 0 ? 'nails' : 'brows', 'skin'];
    const salonMasters = masters.filter((master) => master.salonId === salons[s].id);
    for (const key of keys) {
      for (const [name, durationMin, price] of SERVICE_BANK[key].slice(0, 2)) {
        const service = await prisma.service.create({
          data: {
            salonId: salons[s].id,
            categoryId: categories[key].id,
            name,
            description: `${name} в ${salons[s].name}. Длительность учтена в свободных окнах.`,
            durationMin,
            price: price + (s % 3) * 200,
            active: true,
          },
        });
        for (const master of salonMasters) {
          await prisma.masterService.create({ data: { masterId: master.id, serviceId: service.id } });
        }
        services.push(service);
      }
    }
  }
  const solos = masters.filter((master) => !master.salonId);
  for (const master of solos) {
    const key = 'nails';
    const [name, durationMin, price] = SERVICE_BANK[key][0];
    const service = await prisma.service.create({
      data: {
        categoryId: categories[key].id,
        name: `${name} · ${master.firstName}`,
        description: 'Услуга независимого мастера.',
        durationMin,
        price,
        active: true,
        masters: { create: [{ masterId: master.id }] },
      },
    });
    services.push(service);
  }

  const times = ['10:00', '11:30', '13:00', '15:00', '16:30', '18:00'];
  const bookings = [];
  for (let i = 0; i < 120; i += 1) {
    const master = masters[i % masters.length];
    const linked = await prisma.masterService.findMany({ where: { masterId: master.id }, include: { service: true } });
    if (!linked.length) continue;
    const link = linked[i % linked.length];
    const dayOffset = i < 40 ? -((i % 25) + 1) : i < 55 ? 0 : (i % 12) + 1;
    const date = dateShift(dayOffset);
    const start = at(date, times[i % times.length]);
    const end = new Date(start.getTime() + link.service.durationMin * 60000);
    const client = clients[i % clients.length];
    let status = 'CONFIRMED';
    if (dayOffset < 0) status = i % 11 === 0 ? 'NO_SHOW' : i % 7 === 0 ? 'CANCELLED' : 'COMPLETED';
    if (dayOffset === 0) status = i % 2 === 0 ? 'CONFIRMED' : 'PENDING';
    if (dayOffset > 0) status = i % 4 === 0 ? 'PENDING' : 'CONFIRMED';
    const profile = await prisma.profile.findUnique({ where: { userId: client.id } });
    const booking = await prisma.booking.create({
      data: {
        publicId: `LN-${String(100000 + i).slice(1)}`,
        clientId: client.id,
        salonId: master.salonId,
        masterId: master.id,
        serviceId: link.service.id,
        startAt: start,
        endAt: end,
        status,
        clientName: `${profile.firstName} ${profile.lastName}`,
        clientPhone: profile.phone || '+7 900 000-00-00',
        clientEmail: client.email,
        price: link.service.price,
        notes: i % 9 === 0 ? 'Прошу тихое место у окна' : null,
      },
    });
    bookings.push(booking);
    if (status === 'COMPLETED' && master.salonId) {
      await prisma.payment.create({ data: { bookingId: booking.id, userId: client.id, amount: booking.price, status: 'PAID' } });
    }
  }

  const completed = bookings.filter((item) => item.status === 'COMPLETED').slice(0, 48);
  const comments = [
    'Спокойный визит, время совпало с записью.',
    'Аккуратная работа и понятная цена.',
    'Вернусь к этому мастеру.',
    'Понравилось, что окно не сдвинули.',
    'Тихий зал и точный результат.',
    'Коротко, чисто, без ожидания.',
  ];
  for (let i = 0; i < completed.length; i += 1) {
    const booking = completed[i];
    await prisma.review.create({
      data: {
        bookingId: booking.id,
        authorId: booking.clientId,
        salonId: booking.salonId,
        masterId: booking.masterId,
        rating: 4 + (i % 2),
        comment: comments[i % comments.length],
        reply: i % 3 === 0 ? 'Спасибо, что пришли. Ждём снова.' : null,
        replyAt: i % 3 === 0 ? new Date() : null,
      },
    });
  }

  const salonIds = [...new Set(bookings.map((item) => item.salonId).filter(Boolean))];
  for (const salonId of salonIds) {
    const own = bookings.filter((item) => item.salonId === salonId);
    const byEmail = new Map();
    for (const booking of own) byEmail.set(booking.clientEmail, booking);
    for (const booking of byEmail.values()) {
      await prisma.salonClient.upsert({
        where: { salonId_email: { salonId, email: booking.clientEmail } },
        update: { name: booking.clientName, phone: booking.clientPhone },
        create: {
          salonId,
          userId: booking.clientId,
          name: booking.clientName,
          phone: booking.clientPhone,
          email: booking.clientEmail,
          notes: booking.clientEmail === 'client@lunea.test' ? 'Предпочитает утренние окна' : null,
        },
      });
    }
  }

  for (const master of masters) {
    const links = await prisma.masterService.findMany({ where: { masterId: master.id }, include: { service: true } });
    const prices = links.map((link) => link.price ?? link.service.price);
    const agg = await prisma.review.aggregate({ where: { masterId: master.id }, _avg: { rating: true }, _count: true });
    await prisma.master.update({
      where: { id: master.id },
      data: {
        priceFrom: prices.length ? Math.min(...prices) : 0,
        rating: Number((agg._avg.rating || 0).toFixed(2)),
        reviewCount: agg._count,
      },
    });
  }
  for (const salon of salons) {
    const items = await prisma.service.findMany({ where: { salonId: salon.id, active: true } });
    const agg = await prisma.review.aggregate({ where: { salonId: salon.id }, _avg: { rating: true }, _count: true });
    await prisma.salon.update({
      where: { id: salon.id },
      data: {
        priceFrom: items.length ? Math.min(...items.map((item) => item.price)) : 0,
        rating: Number((agg._avg.rating || 0).toFixed(2)),
        reviewCount: agg._count,
      },
    });
  }

  await prisma.favorite.createMany({
    data: [
      { userId: demoClient.id, targetType: 'SALON', targetId: salons[0].id },
      { userId: demoClient.id, targetType: 'MASTER', targetId: masters[0].id },
      { userId: demoClient.id, targetType: 'SERVICE', targetId: services[0].id },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: demoClient.id, type: 'BOOKING_CREATED', title: 'Запись создана', body: 'Маникюр в Ателье Северное', link: '/dashboard/appointments', read: true },
      { userId: demoClient.id, type: 'BOOKING_CONFIRMED', title: 'Запись подтверждена', body: 'Салон подтвердил визит', link: '/dashboard/appointments' },
      { userId: demoClient.id, type: 'REVIEW_REQUEST', title: 'Как прошёл визит?', body: 'Можно оставить отзыв о завершённой записи', link: '/dashboard/appointments' },
      { userId: owner.id, type: 'BOOKING_CREATED', title: 'Новая запись', body: 'Анна Иванова записалась на услугу', link: '/business/appointments' },
      { userId: demoMasterUser.id, type: 'BOOKING_REMINDER', title: 'Скоро визит', body: 'Проверьте расписание на завтра', link: '/business/calendar' },
    ],
  });

  const thread = await prisma.messageThread.create({
    data: {
      clientId: demoClient.id,
      salonId: salons[0].id,
      subject: 'Перенос утренней записи',
      messages: {
        create: [
          { authorId: demoClient.id, body: 'Добрый день. Можно ли перенести визит на час позже?' },
          { authorId: owner.id, body: 'Да, перенесли на ближайшее свободное окно. Оно уже в календаре.' },
        ],
      },
    },
  });
  await prisma.auditLog.create({
    data: { userId: owner.id, action: 'seed', entity: 'MessageThread', entityId: thread.id },
  });

  await prisma.systemSetting.createMany({
    data: [
      { key: 'siteName', value: 'LUNEA' },
      { key: 'supportEmail', value: 'hello@lunea.test' },
      { key: 'bookingLeadMinutes', value: '15' },
    ],
  });

  const [salonCount, masterCount, serviceCount, clientCount, bookingCount] = await Promise.all([
    prisma.salon.count(),
    prisma.master.count(),
    prisma.service.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.booking.count(),
  ]);
  console.log(`Seed: салоны ${salonCount}, мастера ${masterCount}, услуги ${serviceCount}, клиенты ${clientCount}, записи ${bookingCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
