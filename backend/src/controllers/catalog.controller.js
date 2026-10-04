const { prisma } = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { uniqueSlug } = require('../utils/slug');
const { pageParams, pageMeta } = require('../utils/pagination');
const { masterInclude, salonCardSelect, presentMaster } = require('../utils/present');
const { CITIES, cityByName, haversine } = require('../utils/cities');
const { weekdayMoscow, todayMoscow, parseMinutes } = require('../utils/time');
const { datesWithSlots } = require('../services/availability');
const { audit, recomputePriceFrom } = require('../services/notify');
const { workspace, assertMasterManage } = require('../services/access');
const { issueMasterAccess, staffLogin } = require('../utils/staff');

function defaultHours(extra, sundayOff = true) {
  return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    ...extra,
    dayOfWeek,
    startTime: '10:00',
    endTime: '20:00',
    breakStart: dayOfWeek === 0 ? null : '14:00',
    breakEnd: dayOfWeek === 0 ? null : '15:00',
    isOff: sundayOff && dayOfWeek === 0,
  }));
}

function isOpen(hours) {
  if (!hours?.length) return false;
  const date = todayMoscow();
  const weekday = weekdayMoscow(date);
  const hour = hours.find((item) => item.dayOfWeek === weekday);
  if (!hour || hour.isOff) return false;
  const label = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
  const [h, m] = label.split(':').map(Number);
  const now = h * 60 + m;
  return now >= parseMinutes(hour.startTime) && now < parseMinutes(hour.endTime);
}

async function replaceHours(where, hours) {
  await prisma.workingHour.deleteMany({ where });
  if (!hours?.length) return;
  await prisma.workingHour.createMany({
    data: hours.map((hour) => ({
      ...where,
      dayOfWeek: hour.dayOfWeek,
      startTime: hour.startTime,
      endTime: hour.endTime,
      breakStart: hour.breakStart || null,
      breakEnd: hour.breakEnd || null,
      isOff: Boolean(hour.isOff),
    })),
  });
}

async function listSalons(req, res) {
  const { page, pageSize, skip } = pageParams(req.query);
  const where = {
    ...(req.query.city ? { city: req.query.city } : {}),
    ...(req.query.q ? { name: { contains: req.query.q, mode: 'insensitive' } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.salon.count({ where }),
    prisma.salon.findMany({ where, orderBy: { rating: 'desc' }, skip, take: pageSize, select: salonCardSelect }),
  ]);
  res.json({ data: rows, meta: pageMeta(page, pageSize, total) });
}

async function getSalon(req, res) {
  const salon = await prisma.salon.findUnique({
    where: { slug: req.params.slug },
    include: {
      branches: true,
      hours: { orderBy: { dayOfWeek: 'asc' } },
      services: { where: { active: true }, include: { category: true, masters: { include: { master: true } } } },
      masters: { where: { suspended: false }, include: masterInclude },
      reviews: { orderBy: { createdAt: 'desc' }, take: 20, include: { author: { include: { profile: true } } } },
      subscription: true,
    },
  });
  if (!salon) throw new AppError(404, 'Салон не найден');
  res.json({
    data: {
      ...salon,
      open: isOpen(salon.hours),
      masters: salon.masters.map((master) => presentMaster(master)),
    },
  });
}

async function createSalon(req, res) {
  if (!['SALON_OWNER', 'SUPER_ADMIN'].includes(req.user.role)) {
    throw new AppError(403, 'Создавать салон может владелец');
  }
  const existing = await prisma.salon.findFirst({ where: { ownerId: req.user.id } });
  if (existing && req.user.role !== 'SUPER_ADMIN') throw new AppError(409, 'У вас уже есть салон');
  const city = cityByName(req.body.city);
  const slug = await uniqueSlug('salon', req.body.name);
  const salon = await prisma.salon.create({
    data: {
      slug,
      name: req.body.name,
      description: req.body.description,
      address: req.body.address,
      city: req.body.city,
      phone: req.body.phone,
      cover: req.body.cover || null,
      logo: req.body.logo || null,
      lat: city?.lat ?? null,
      lng: city?.lng ?? null,
      ownerId: req.user.id,
      hours: { create: defaultHours({}) },
      subscription: { create: { plan: 'start', status: 'TRIAL' } },
    },
  });
  await audit(req.user.id, 'create', 'Salon', salon.id);
  res.status(201).json({ data: salon });
}

async function patchSalon(req, res) {
  const salon = await prisma.salon.findUnique({ where: { id: req.params.id } });
  if (!salon) throw new AppError(404, 'Салон не найден');
  const allowed = req.user.role === 'SUPER_ADMIN' || salon.ownerId === req.user.id
    || await prisma.salonMember.findUnique({ where: { salonId_userId: { salonId: salon.id, userId: req.user.id } } });
  if (!allowed) throw new AppError(403, 'Нет доступа к салону');
  const city = req.body.city ? cityByName(req.body.city) : null;
  const data = {
    name: req.body.name,
    description: req.body.description,
    address: req.body.address,
    city: req.body.city,
    phone: req.body.phone,
    cover: req.body.cover,
    logo: req.body.logo,
    gallery: req.body.gallery,
  };
  if (req.body.name && req.body.name !== salon.name) data.slug = await uniqueSlug('salon', req.body.name, salon.id);
  if (city) {
    data.lat = city.lat;
    data.lng = city.lng;
  }
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
  const updated = await prisma.salon.update({ where: { id: salon.id }, data });
  if (req.body.hours) await replaceHours({ salonId: salon.id }, req.body.hours);
  res.json({ data: updated });
}

async function createBranch(req, res) {
  const salon = await prisma.salon.findUnique({ where: { id: req.params.id } });
  if (!salon) throw new AppError(404, 'Салон не найден');
  if (salon.ownerId !== req.user.id && req.user.role !== 'SUPER_ADMIN') throw new AppError(403, 'Нет доступа');
  const city = cityByName(req.body.city);
  const branch = await prisma.salonBranch.create({
    data: {
      salonId: salon.id,
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      phone: req.body.phone || null,
      lat: city?.lat ?? salon.lat,
      lng: city?.lng ?? salon.lng,
    },
  });
  res.status(201).json({ data: branch });
}

async function deleteBranch(req, res) {
  const branch = await prisma.salonBranch.findUnique({ where: { id: req.params.id } });
  if (!branch) throw new AppError(404, 'Филиал не найден');
  if (req.user.role !== 'SUPER_ADMIN') {
    const salon = await prisma.salon.findUnique({ where: { id: branch.salonId } });
    if (salon.ownerId !== req.user.id) throw new AppError(403, 'Нет доступа');
  }
  await prisma.salonBranch.delete({ where: { id: branch.id } });
  res.json({ data: { ok: true } });
}

async function listMasters(req, res) {
  const { page, pageSize, skip } = pageParams(req.query);
  const where = {
    suspended: req.query.includeSuspended === '1' ? undefined : false,
    ...(req.query.city ? { city: req.query.city } : {}),
    ...(req.query.salonId ? { salonId: req.query.salonId } : {}),
    ...(req.query.q
      ? {
          OR: [
            { firstName: { contains: req.query.q, mode: 'insensitive' } },
            { lastName: { contains: req.query.q, mode: 'insensitive' } },
            { specialization: { contains: req.query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.master.count({ where }),
    prisma.master.findMany({
      where,
      include: masterInclude,
      orderBy: { rating: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);
  let revealLogins = req.user?.role === 'SUPER_ADMIN';
  if (!revealLogins && req.user && req.query.salonId) {
    const space = await workspace(req.user).catch(() => null);
    revealLogins = space?.type === 'salon' && space.salon?.id === req.query.salonId;
  }
  res.json({
    data: rows.map((row) => ({
      ...presentMaster(row),
      ...(revealLogins ? { login: staffLogin(row.user?.email) } : {}),
    })),
    meta: pageMeta(page, pageSize, total),
  });
}

async function getMaster(req, res) {
  const master = await prisma.master.findUnique({
    where: { slug: req.params.slug },
    include: {
      ...masterInclude,
      hours: { orderBy: { dayOfWeek: 'asc' } },
      reviews: { orderBy: { createdAt: 'desc' }, take: 20, include: { author: { include: { profile: true } } } },
    },
  });
  if (!master || (master.suspended && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== master.userId)) {
    throw new AppError(404, 'Мастер не найден');
  }
  const next = master.services[0]
    ? await datesWithSlots(master.id, master.services[0].durationMin || master.services[0].service.durationMin, 7)
    : [];
  res.json({ data: { ...presentMaster(master), hours: master.hours, reviews: master.reviews, nextDates: next } });
}

async function createMaster(req, res) {
  const space = await workspace(req.user);
  if (space.type !== 'salon') throw new AppError(403, 'Мастера добавляет салон');
  const access = await issueMasterAccess({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    city: req.body.city || space.salon.city,
  });
  const slug = await uniqueSlug('master', `${req.body.firstName}-${req.body.lastName}`);
  let master;
  try {
    master = await prisma.master.create({
      data: {
        slug,
        userId: access.userId,
        salonId: space.salon.id,
        branchId: req.body.branchId || null,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        bio: req.body.bio || '',
        specialization: req.body.specialization,
        experienceYears: req.body.experienceYears,
        instagram: req.body.instagram || null,
        gender: req.body.gender || 'FEMALE',
        photo: req.body.photo || null,
        city: req.body.city || space.salon.city,
        priceFrom: req.body.priceFrom || 0,
      },
    });
  } catch (error) {
    await prisma.user.delete({ where: { id: access.userId } }).catch(() => {});
    throw error;
  }
  await replaceHours({ masterId: master.id }, req.body.hours?.length ? req.body.hours : defaultHours({}));
  if (req.body.serviceIds?.length) {
    await prisma.masterService.createMany({
      data: req.body.serviceIds.map((serviceId) => ({ masterId: master.id, serviceId })),
      skipDuplicates: true,
    });
    await recomputePriceFrom(master.id, space.salon.id);
  }
  await audit(req.user.id, 'create', 'Master', master.id);
  const full = await prisma.master.findUnique({ where: { id: master.id }, include: masterInclude });
  res.status(201).json({
    data: { ...presentMaster(full), login: access.login },
    credentials: { login: access.login, password: access.password },
  });
}

async function resetMasterPassword(req, res) {
  const master = await assertMasterManage(req.user, req.params.id);
  if (req.user.role === 'MASTER' && master.userId === req.user.id) {
    throw new AppError(403, 'Пароль мастеру выдаёт салон');
  }
  const access = await issueMasterAccess({
    firstName: master.firstName,
    lastName: master.lastName,
    city: master.city,
    userId: master.userId,
  });
  if (!master.userId) {
    await prisma.master.update({ where: { id: master.id }, data: { userId: access.userId } });
  }
  await audit(req.user.id, 'reset-password', 'Master', master.id);
  res.json({ data: { login: access.login, password: access.password } });
}

async function patchMaster(req, res) {
  const master = await assertMasterManage(req.user, req.params.id);
  const data = { ...req.body };
  delete data.serviceIds;
  delete data.hours;
  delete data.priceFrom;
  if (data.firstName || data.lastName) {
    data.slug = await uniqueSlug('master', `${data.firstName || master.firstName}-${data.lastName || master.lastName}`, master.id);
  }
  if (data.instagram === '') data.instagram = null;
  if (data.photo === '') data.photo = null;
  if (data.bio === '') data.bio = '';
  const updated = await prisma.master.update({ where: { id: master.id }, data });
  if (req.body.hours) await replaceHours({ masterId: master.id }, req.body.hours);
  if (req.body.serviceIds) {
    await prisma.masterService.deleteMany({ where: { masterId: master.id } });
    if (req.body.serviceIds.length) {
      await prisma.masterService.createMany({
        data: req.body.serviceIds.map((serviceId) => ({ masterId: master.id, serviceId })),
      });
    }
    await recomputePriceFrom(master.id, master.salonId);
  }
  const full = await prisma.master.findUnique({ where: { id: updated.id }, include: masterInclude });
  res.json({ data: presentMaster(full) });
}

async function removeMaster(req, res) {
  const master = await assertMasterManage(req.user, req.params.id);
  const bookings = await prisma.booking.count({ where: { masterId: master.id } });
  if (bookings) throw new AppError(409, 'У мастера есть записи. Его можно приостановить.');
  await prisma.master.delete({ where: { id: master.id } });
  res.json({ data: { ok: true } });
}

async function putHours(req, res) {
  const master = await assertMasterManage(req.user, req.params.id);
  await replaceHours({ masterId: master.id }, req.body.hours);
  const hours = await prisma.workingHour.findMany({ where: { masterId: master.id }, orderBy: { dayOfWeek: 'asc' } });
  res.json({ data: hours });
}

async function addDayOff(req, res) {
  const master = await assertMasterManage(req.user, req.params.id);
  const row = await prisma.dayOff.upsert({
    where: { masterId_date: { masterId: master.id, date: new Date(`${req.body.date}T00:00:00.000Z`) } },
    update: { reason: req.body.reason || null },
    create: {
      masterId: master.id,
      date: new Date(`${req.body.date}T00:00:00.000Z`),
      reason: req.body.reason || null,
    },
  });
  res.status(201).json({ data: row });
}

async function removeDayOff(req, res) {
  await assertMasterManage(req.user, req.params.id);
  await prisma.dayOff.deleteMany({
    where: { id: req.params.dayOffId, masterId: req.params.id },
  });
  res.json({ data: { ok: true } });
}

async function listDayOffs(req, res) {
  await assertMasterManage(req.user, req.params.id);
  const rows = await prisma.dayOff.findMany({ where: { masterId: req.params.id }, orderBy: { date: 'asc' } });
  res.json({ data: rows });
}

async function listServices(req, res) {
  const where = {
    active: req.query.all === '1' ? undefined : true,
    ...(req.query.salonId ? { salonId: req.query.salonId } : {}),
    ...(req.query.category ? { category: { slug: req.query.category } } : {}),
    ...(req.query.q ? { name: { contains: req.query.q, mode: 'insensitive' } } : {}),
  };
  const rows = await prisma.service.findMany({
    where,
    include: { category: true, masters: { include: { master: true } }, salon: { select: { slug: true, name: true, city: true } } },
    orderBy: { name: 'asc' },
    take: 100,
  });
  res.json({ data: rows });
}

async function getService(req, res) {
  const service = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      salon: true,
      masters: { include: { master: true } },
    },
  });
  if (!service) throw new AppError(404, 'Услуга не найдена');
  res.json({ data: service });
}

async function createService(req, res) {
  const space = await workspace(req.user);
  let salonId = req.body.salonId || null;
  if (space.type === 'salon') salonId = space.salon.id;
  if (space.type === 'master') {
    const owns = req.body.masterIds?.every((id) => id === space.master.id);
    if (!owns) throw new AppError(403, 'Можно привязать услугу только к себе');
    salonId = space.master.salonId;
  }
  if (!salonId && space.type !== 'master') throw new AppError(400, 'Не указан салон');
  const service = await prisma.service.create({
    data: {
      salonId,
      categoryId: req.body.categoryId,
      name: req.body.name,
      description: req.body.description || '',
      durationMin: req.body.durationMin,
      price: req.body.price,
      capacity: req.body.capacity || 1,
      active: req.body.active !== false,
      masters: { create: req.body.masterIds.map((masterId) => ({ masterId })) },
    },
    include: { category: true, masters: true },
  });
  await Promise.all(req.body.masterIds.map((masterId) => recomputePriceFrom(masterId, salonId)));
  res.status(201).json({ data: service });
}

async function patchService(req, res) {
  const service = await prisma.service.findUnique({ where: { id: req.params.id }, include: { masters: true } });
  if (!service) throw new AppError(404, 'Услуга не найдена');
  if (service.salonId) {
    const space = await workspace(req.user);
    if (space.type !== 'salon' || space.salon.id !== service.salonId) {
      if (req.user.role !== 'SUPER_ADMIN') throw new AppError(403, 'Нет доступа');
    }
  } else if (req.user.role !== 'SUPER_ADMIN') {
    const space = await workspace(req.user);
    const linked = service.masters.some((item) => item.masterId === space.master?.id);
    if (!linked) throw new AppError(403, 'Нет доступа');
  }
  const data = { ...req.body };
  delete data.masterIds;
  const updated = await prisma.service.update({ where: { id: service.id }, data });
  if (req.body.masterIds) {
    await prisma.masterService.deleteMany({ where: { serviceId: service.id } });
    await prisma.masterService.createMany({
      data: req.body.masterIds.map((masterId) => ({ masterId, serviceId: service.id })),
    });
  }
  const masters = req.body.masterIds || service.masters.map((item) => item.masterId);
  await Promise.all(masters.map((masterId) => recomputePriceFrom(masterId, service.salonId)));
  if (service.salonId) await recomputePriceFrom(null, service.salonId);
  res.json({ data: updated });
}

async function listCategories(req, res) {
  const rows = await prisma.serviceCategory.findMany({ orderBy: { nameEn: 'asc' } });
  res.json({ data: rows });
}

async function cities(req, res) {
  res.json({ data: CITIES });
}

async function home(req, res) {
  const city = req.query.city || 'Москва';
  const [featured, fresh, nearby, categories, spotlight, showcase] = await Promise.all([
    prisma.salon.findFirst({ where: { verified: true }, orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }], select: salonCardSelect }),
    prisma.master.findMany({ where: { suspended: false }, orderBy: { createdAt: 'desc' }, take: 3, include: masterInclude }),
    prisma.salon.findFirst({
      where: { city, verified: true },
      orderBy: { reviewCount: 'desc' },
      select: salonCardSelect,
    }),
    prisma.serviceCategory.findMany({ orderBy: { nameEn: 'asc' } }),
    prisma.master.findMany({ where: { suspended: false, verified: true }, orderBy: { rating: 'desc' }, take: 8, include: masterInclude }),
    prisma.salon.findFirst({
      where: { verified: true },
      orderBy: { reviewCount: 'desc' },
      include: {
        services: { where: { active: true }, take: 4, include: { category: true } },
      },
    }),
  ]);
  res.json({
    data: {
      featured,
      newMasters: fresh.map((item) => presentMaster(item)),
      nearby,
      categories,
      spotlight: spotlight.map((item) => presentMaster(item)),
      showcase,
    },
  });
}

function originFrom(query) {
  if (query.lat && query.lng) return { lat: Number(query.lat), lng: Number(query.lng) };
  const city = cityByName(query.city);
  return city ? { lat: city.lat, lng: city.lng } : null;
}

async function search(req, res) {
  const type = req.query.type || 'all';
  const q = (req.query.q || '').trim();
  const city = req.query.city || undefined;
  const minRating = Number(req.query.rating || 0);
  const maxPrice = req.query.price ? Number(req.query.price) : undefined;
  const gender = req.query.gender || undefined;
  const experience = req.query.experience ? Number(req.query.experience) : undefined;
  const distance = req.query.distance ? Number(req.query.distance) : undefined;
  const sort = req.query.sort || 'recommended';
  const available = req.query.availability === 'today' || sort === 'today';
  const origin = originFrom(req.query);
  const { page, pageSize } = pageParams(req.query);

  const result = { salons: [], masters: [], services: [], meta: {} };

  if (type === 'all' || type === 'salon') {
    let salons = await prisma.salon.findMany({
      where: {
        ...(city ? { city } : {}),
        ...(minRating ? { rating: { gte: minRating } } : {}),
        ...(maxPrice ? { priceFrom: { lte: maxPrice } } : {}),
        ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
      },
      select: salonCardSelect,
    });
    salons = salons.map((salon) => ({
      ...salon,
      distance: origin && salon.lat != null ? Number(haversine(origin.lat, origin.lng, salon.lat, salon.lng).toFixed(1)) : null,
    }));
    if (distance) salons = salons.filter((salon) => salon.distance != null && salon.distance <= distance);
    salons = sortRows(salons, sort);
    result.meta.salons = salons.length;
    result.salons = salons.slice((page - 1) * pageSize, page * pageSize);
  }

  if (type === 'all' || type === 'master') {
    let masters = await prisma.master.findMany({
      where: {
        suspended: false,
        ...(city ? { city } : {}),
        ...(minRating ? { rating: { gte: minRating } } : {}),
        ...(maxPrice ? { priceFrom: { lte: maxPrice } } : {}),
        ...(gender && gender !== 'ANY' ? { gender } : {}),
        ...(experience ? { experienceYears: { gte: experience } } : {}),
        ...(req.query.service
          ? { services: { some: { service: { OR: [{ name: { contains: req.query.service, mode: 'insensitive' } }, { category: { slug: req.query.service } }] } } } }
          : {}),
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { specialization: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { ...masterInclude, salon: { select: { id: true, slug: true, name: true, city: true, address: true, lat: true, lng: true } } },
    });
    masters = masters.map((master) => {
      const lat = master.salon?.lat;
      const lng = master.salon?.lng;
      const point = lat != null ? { lat, lng } : cityByName(master.city);
      return {
        ...presentMaster(master),
        distance: origin && point ? Number(haversine(origin.lat, origin.lng, point.lat, point.lng).toFixed(1)) : null,
      };
    });
    if (distance) masters = masters.filter((master) => master.distance != null && master.distance <= distance);
    if (available) {
      const flags = await Promise.all(masters.map(async (master) => {
        const duration = master.services[0]?.durationMin || 60;
        const dates = await datesWithSlots(master.id, duration, 1);
        return dates.length > 0;
      }));
      masters = masters.filter((_, index) => flags[index]);
    }
    masters = sortRows(masters, sort);
    result.meta.masters = masters.length;
    result.masters = masters.slice((page - 1) * pageSize, page * pageSize);
  }

  if (type === 'all' || type === 'service') {
    let services = await prisma.service.findMany({
      where: {
        active: true,
        ...(maxPrice ? { price: { lte: maxPrice } } : {}),
        ...(req.query.service ? { OR: [{ category: { slug: req.query.service } }, { name: { contains: req.query.service, mode: 'insensitive' } }] } : {}),
        ...(city ? { OR: [{ salon: { city } }, { masters: { some: { master: { city } } } }] } : {}),
        ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
      },
      include: { category: true, salon: { select: { slug: true, name: true, city: true, lat: true, lng: true } } },
    });
    services = services.map((service) => ({
      ...service,
      distance: origin && service.salon?.lat != null
        ? Number(haversine(origin.lat, origin.lng, service.salon.lat, service.salon.lng).toFixed(1))
        : null,
    }));
    if (distance) services = services.filter((service) => service.distance != null && service.distance <= distance);
    services.sort((a, b) => {
      if (sort === 'price') return a.price - b.price;
      if (sort === 'nearest') return (a.distance ?? 999) - (b.distance ?? 999);
      return a.name.localeCompare(b.name, 'ru');
    });
    result.meta.services = services.length;
    result.services = services.slice((page - 1) * pageSize, page * pageSize);
  }

  res.json({ data: result });
}

function sortRows(rows, sort) {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sort === 'price') return (a.priceFrom ?? a.price ?? 0) - (b.priceFrom ?? b.price ?? 0);
    if (sort === 'nearest') return (a.distance ?? 999) - (b.distance ?? 999);
    if (sort === 'rating' || sort === 'today') return (b.rating || 0) - (a.rating || 0);
    return (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0);
  });
  return copy;
}

async function suggest(req, res) {
  const q = (req.query.q || '').trim();
  const [services, salons, masters, popular] = await Promise.all([
    prisma.service.findMany({
      where: q ? { active: true, name: { contains: q, mode: 'insensitive' } } : { active: true },
      select: { id: true, name: true, price: true, durationMin: true },
      take: 5,
    }),
    prisma.salon.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : { verified: true },
      select: { id: true, slug: true, name: true, city: true },
      take: 4,
    }),
    prisma.master.findMany({
      where: q
        ? {
            suspended: false,
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : { suspended: false, verified: true },
      select: { id: true, slug: true, firstName: true, lastName: true, specialization: true },
      take: 4,
    }),
    prisma.service.findMany({
      where: { active: true },
      select: { name: true },
      distinct: ['name'],
      take: 6,
    }),
  ]);
  res.json({
    data: {
      services,
      salons,
      masters: masters.map((master) => ({ ...master, name: `${master.firstName} ${master.lastName}` })),
      popular: popular.map((item) => item.name),
    },
  });
}

module.exports = {
  listSalons,
  getSalon,
  createSalon,
  patchSalon,
  createBranch,
  deleteBranch,
  listMasters,
  getMaster,
  createMaster,
  resetMasterPassword,
  patchMaster,
  removeMaster,
  putHours,
  addDayOff,
  removeDayOff,
  listDayOffs,
  listServices,
  getService,
  createService,
  patchService,
  listCategories,
  cities,
  home,
  search,
  suggest,
};
