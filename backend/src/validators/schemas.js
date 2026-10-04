const { z } = require('zod');

const email = z.string().trim().email('Укажите корректный email').max(160);
const password = z.string().min(8, 'Минимум 8 символов').max(72);
const time = z.string().regex(/^\d{2}:\d{2}$/, 'Формат ЧЧ:ММ');

const register = z.object({
  body: z.object({
    email,
    password,
    role: z.enum(['CLIENT', 'SALON_OWNER']),
    firstName: z.string().trim().min(1, 'Укажите имя').max(60),
    lastName: z.string().trim().min(1, 'Укажите фамилию').max(60),
    phone: z.string().trim().min(6).max(24).optional().or(z.literal('')),
    city: z.string().trim().max(80).optional().or(z.literal('')),
    specialization: z.string().trim().max(80).optional().or(z.literal('')),
  }),
});

const login = z.object({
  body: z.object({
    email: z.string().trim().min(3, 'Введите email или логин').max(160),
    password: z.string().min(1, 'Введите пароль'),
  }),
});

const forgot = z.object({ body: z.object({ email }) });

const reset = z.object({
  body: z.object({ token: z.string().min(10), password }),
});

const verify = z.object({
  body: z.object({ token: z.string().min(10) }),
});

const profile = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    phone: z.string().trim().max(24).optional().or(z.literal('')),
    city: z.string().trim().max(80).optional().or(z.literal('')),
    bio: z.string().trim().max(800).optional().or(z.literal('')),
    notifyEmail: z.boolean().optional(),
    avatar: z.string().trim().max(500).optional().or(z.literal('')),
  }),
});

const hour = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: time,
  endTime: time,
  breakStart: time.optional().nullable(),
  breakEnd: time.optional().nullable(),
  isOff: z.boolean().optional(),
});

const salonCreate = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().min(10).max(2000),
    address: z.string().trim().min(3).max(160),
    city: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(6).max(24),
    cover: z.string().trim().max(500).optional().or(z.literal('')),
    logo: z.string().trim().max(500).optional().or(z.literal('')),
  }),
});

const salonPatch = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    address: z.string().trim().min(3).max(160).optional(),
    city: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().min(6).max(24).optional(),
    cover: z.string().trim().max(500).optional(),
    logo: z.string().trim().max(500).optional(),
    gallery: z.array(z.string().max(500)).max(12).optional(),
    hours: z.array(hour).max(7).optional(),
  }),
});

const branch = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    address: z.string().trim().min(3).max(160),
    city: z.string().trim().min(2).max(80),
    phone: z.string().trim().max(24).optional().or(z.literal('')),
  }),
});

const masterBody = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  bio: z.string().trim().max(2000).optional().or(z.literal('')),
  specialization: z.string().trim().min(2).max(80),
  experienceYears: z.number().int().min(0).max(60),
  instagram: z.string().trim().max(80).optional().or(z.literal('')),
  gender: z.enum(['FEMALE', 'MALE', 'ANY']).optional(),
  photo: z.string().trim().max(500).optional().or(z.literal('')),
  city: z.string().trim().min(2).max(80).optional(),
  branchId: z.string().optional().nullable(),
  serviceIds: z.array(z.string()).optional(),
  hours: z.array(hour).max(7).optional(),
  priceFrom: z.number().int().min(0).optional(),
});

const masterCreate = z.object({ body: masterBody });
const masterPatch = z.object({
  body: masterBody.partial().extend({ suspended: z.boolean().optional() }),
});

const serviceBody = z.object({
  name: z.string().trim().min(2).max(80),
  categoryId: z.string().min(1),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  durationMin: z.number().int().min(15).max(480),
  price: z.number().int().min(0).max(1000000),
  capacity: z.number().int().min(1).max(40).optional(),
  masterIds: z.array(z.string()).min(1, 'Выберите хотя бы одного мастера'),
  active: z.boolean().optional(),
  salonId: z.string().optional().nullable(),
});

const serviceCreate = z.object({ body: serviceBody });
const servicePatch = z.object({ body: serviceBody.partial() });

const bookingCreate = z.object({
  body: z.object({
    masterId: z.string().min(1),
    serviceId: z.string().min(1),
    startAt: z.string().datetime(),
    clientName: z.string().trim().min(2).max(80),
    clientPhone: z.string().trim().min(6).max(24),
    clientEmail: email,
    notes: z.string().trim().max(500).optional().or(z.literal('')),
  }),
});

const bookingPatch = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
    startAt: z.string().datetime().optional(),
    resourceId: z.string().nullable().optional(),
    prepaid: z.number().int().min(0).max(1000000).optional(),
  }),
});

const reviewCreate = z.object({
  body: z.object({
    bookingId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(2).max(1000),
  }),
});

const reviewReply = z.object({
  body: z.object({ reply: z.string().trim().min(1).max(1000) }),
});

const favorite = z.object({
  body: z.object({
    targetType: z.enum(['SALON', 'MASTER', 'SERVICE']),
    targetId: z.string().min(1),
  }),
});

const messageThread = z.object({
  body: z.object({
    salonId: z.string().optional().nullable(),
    masterId: z.string().optional().nullable(),
    subject: z.string().trim().min(2).max(120),
    body: z.string().trim().min(1).max(2000),
  }),
});

const message = z.object({
  body: z.object({ body: z.string().trim().min(1).max(2000) }),
});

const hoursPut = z.object({ body: z.object({ hours: z.array(hour).max(7) }) });

const dayOff = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().trim().max(120).optional().or(z.literal('')),
  }),
});

const notes = z.object({
  body: z.object({
    notes: z.string().trim().max(2000).optional(),
    consentData: z.boolean().optional(),
    consentAds: z.boolean().optional(),
    source: z.string().trim().max(40).optional().or(z.literal('')),
    returnWeeks: z.number().int().min(1).max(52).nullable().optional(),
  }),
});

const category = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(40),
    nameEn: z.string().trim().min(2).max(40),
    slug: z.string().trim().min(2).max(40).optional(),
  }),
});

const setting = z.object({
  body: z.object({
    key: z.string().trim().min(2).max(40),
    value: z.string().trim().max(500),
  }),
});

const ban = z.object({ body: z.object({ banned: z.boolean() }) });
const verifyFlag = z.object({ body: z.object({ verified: z.boolean() }) });

module.exports = {
  register,
  login,
  forgot,
  reset,
  verify,
  profile,
  salonCreate,
  salonPatch,
  branch,
  masterCreate,
  masterPatch,
  serviceCreate,
  servicePatch,
  bookingCreate,
  bookingPatch,
  reviewCreate,
  reviewReply,
  favorite,
  messageThread,
  message,
  hoursPut,
  dayOff,
  notes,
  category,
  setting,
  ban,
  verifyFlag,
};
