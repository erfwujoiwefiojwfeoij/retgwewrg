const { z } = require('zod');

const text = (min, max) => z.string().trim().min(min).max(max);
const money = z.number().int().min(0).max(10000000);
const optionalText = z.string().trim().max(500).optional().or(z.literal(''));

const resource = z.object({
  body: z.object({ name: text(2, 80), kind: z.enum(['CHAIR', 'ROOM']) }),
});

const photo = z.object({
  body: z.object({ url: text(1, 500), caption: optionalText }),
});

const product = z.object({
  body: z.object({
    name: text(2, 80),
    unit: text(1, 20).optional(),
    price: money,
    cost: money.optional(),
    stock: z.number().int().min(0).max(100000).optional(),
    minStock: z.number().int().min(0).max(100000).optional(),
  }),
});

const stock = z.object({
  body: z.object({
    qty: z.number().int().min(-100000).max(100000).refine((value) => value !== 0, 'Укажите количество'),
    reason: text(2, 120),
  }),
});

const ledger = z.object({
  body: z.object({
    accountId: z.string().min(1),
    kind: z.enum(['INCOME', 'EXPENSE']),
    amount: z.number().int().min(1).max(10000000),
    category: text(2, 80),
    note: optionalText,
  }),
});

const sale = z.object({
  body: z.object({
    clientId: z.string().optional().nullable(),
    method: z.enum(['CASH', 'CARD', 'CERTIFICATE', 'ABONEMENT', 'BONUS', 'TRANSFER', 'DEPOSIT']),
    tip: money.optional(),
    certificateCode: z.string().trim().max(40).optional().or(z.literal('')),
    abonementId: z.string().optional().nullable(),
    lines: z.array(z.object({
      title: text(1, 80),
      qty: z.number().int().min(1).max(100),
      price: money,
      productId: z.string().optional().nullable(),
    })).min(1).max(20),
  }),
});

const certificate = z.object({
  body: z.object({ amount: z.number().int().min(100).max(1000000), buyerName: optionalText }),
});

const plan = z.object({
  body: z.object({
    name: text(2, 80),
    visits: z.number().int().min(1).max(100),
    price: money,
    days: z.number().int().min(1).max(730).optional(),
  }),
});

const sellPlan = z.object({
  body: z.object({ planId: z.string().min(1), clientId: z.string().min(1) }),
});

const payroll = z.object({
  body: z.object({
    percent: z.number().int().min(0).max(100),
    fixed: money,
  }),
});

const payrollRun = z.object({
  body: z.object({
    masterId: z.string().min(1),
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
});

const channels = z.object({
  body: z.object({
    yandexUrl: z.string().trim().max(300).optional().or(z.literal('')),
    googleUrl: z.string().trim().max(300).optional().or(z.literal('')),
    sip: z.string().trim().max(40).optional().or(z.literal('')),
    bonusPercent: z.number().int().min(0).max(50),
    referralBonus: money,
    channels: z.array(z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM', 'MAX'])).max(5),
  }),
});

const call = z.object({
  body: z.object({
    phone: text(6, 24),
    name: optionalText,
    note: optionalText,
  }),
});

const outreach = z.object({
  body: z.object({
    clientId: z.string().min(1),
    kind: z.enum(['reminder', 'review', 'return', 'rider']),
    channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM', 'MAX']),
    riderSlug: z.string().trim().max(80).optional().or(z.literal('')),
  }),
});

const chat = z.object({ body: z.object({ body: text(1, 2000) }) });

const formula = z.object({
  body: z.object({ title: text(2, 80), body: text(2, 2000) }),
});

const deposit = z.object({
  body: z.object({ amount: z.number().int().min(100).max(1000000) }),
});

const wait = z.object({
  body: z.object({
    name: text(2, 80),
    phone: text(6, 24),
    serviceName: text(2, 80),
    wishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    note: optionalText,
  }),
});

const waitPatch = z.object({
  body: z.object({ status: z.enum(['WAITING', 'OFFERED', 'DONE', 'DROPPED']) }),
});

const closure = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: optionalText,
  }),
});

const member = z.object({
  body: z.object({ firstName: text(2, 40), lastName: text(2, 40) }),
});

module.exports = {
  resource, photo, product, stock, ledger, sale, certificate, plan, sellPlan, payroll, payrollRun, channels, call, outreach, chat, member,
  formula, deposit, wait, waitPatch, closure,
};
