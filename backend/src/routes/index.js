const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRoles } = require('../middleware/auth');
const schemas = require('../validators/schemas');
const auth = require('../controllers/auth.controller');
const catalog = require('../controllers/catalog.controller');
const booking = require('../controllers/booking.controller');
const account = require('../controllers/account.controller');
const admin = require('../controllers/admin.controller');
const uploadController = require('../controllers/upload.controller');
const desk = require('../controllers/desk.controller');
const rider = require('../controllers/rider.controller');
const ops = require('../validators/ops');

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const writeLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });

const router = Router();

router.get('/health', (req, res) => res.json({ data: { ok: true } }));
router.get('/auth/csrf', asyncHandler(auth.csrf));
router.post('/auth/register', authLimit, validate(schemas.register), asyncHandler(auth.register));
router.post('/auth/login', authLimit, validate(schemas.login), asyncHandler(auth.login));
router.post('/auth/logout', asyncHandler(auth.logout));
router.post('/auth/refresh', asyncHandler(auth.refresh));
router.post('/auth/forgot-password', authLimit, validate(schemas.forgot), asyncHandler(auth.forgot));
router.post('/auth/reset-password', authLimit, validate(schemas.reset), asyncHandler(auth.reset));
router.post('/auth/verify-email', validate(schemas.verify), asyncHandler(auth.verifyEmail));
router.get('/auth/me', requireAuth, asyncHandler(auth.me));
router.patch('/auth/me', requireAuth, validate(schemas.profile), asyncHandler(auth.updateMe));

router.get('/cities', asyncHandler(catalog.cities));
router.get('/categories', asyncHandler(catalog.listCategories));
router.get('/home', asyncHandler(catalog.home));
router.get('/search', asyncHandler(catalog.search));
router.get('/search/suggest', asyncHandler(catalog.suggest));

router.get('/salons', asyncHandler(catalog.listSalons));
router.get('/salons/:slug', asyncHandler(catalog.getSalon));
router.post('/salons', requireAuth, writeLimit, validate(schemas.salonCreate), asyncHandler(catalog.createSalon));
router.patch('/salons/:id', requireAuth, validate(schemas.salonPatch), asyncHandler(catalog.patchSalon));
router.post('/salons/:id/branches', requireAuth, validate(schemas.branch), asyncHandler(catalog.createBranch));
router.delete('/branches/:id', requireAuth, asyncHandler(catalog.deleteBranch));

router.get('/masters', asyncHandler(catalog.listMasters));
router.get('/masters/:slug', asyncHandler(catalog.getMaster));
router.post('/masters', requireAuth, validate(schemas.masterCreate), asyncHandler(catalog.createMaster));
router.post('/masters/:id/password', requireAuth, asyncHandler(catalog.resetMasterPassword));
router.patch('/masters/:id', requireAuth, validate(schemas.masterPatch), asyncHandler(catalog.patchMaster));
router.delete('/masters/:id', requireAuth, asyncHandler(catalog.removeMaster));
router.put('/masters/:id/hours', requireAuth, validate(schemas.hoursPut), asyncHandler(catalog.putHours));
router.get('/masters/:id/days-off', requireAuth, asyncHandler(catalog.listDayOffs));
router.post('/masters/:id/days-off', requireAuth, validate(schemas.dayOff), asyncHandler(catalog.addDayOff));
router.delete('/masters/:id/days-off/:dayOffId', requireAuth, asyncHandler(catalog.removeDayOff));

router.get('/services', asyncHandler(catalog.listServices));
router.get('/services/:id', asyncHandler(catalog.getService));
router.post('/services', requireAuth, validate(schemas.serviceCreate), asyncHandler(catalog.createService));
router.patch('/services/:id', requireAuth, validate(schemas.servicePatch), asyncHandler(catalog.patchService));

router.get('/availability', asyncHandler(booking.availability));
router.get('/bookings', requireAuth, asyncHandler(booking.listBookings));
router.get('/bookings/:id', requireAuth, asyncHandler(booking.getBooking));
router.post('/bookings', writeLimit, validate(schemas.bookingCreate), asyncHandler(booking.createBooking));
router.patch('/bookings/:id', requireAuth, validate(schemas.bookingPatch), asyncHandler(booking.patchBooking));

router.get('/reviews', asyncHandler(booking.listReviews));
router.post('/reviews', requireAuth, validate(schemas.reviewCreate), asyncHandler(booking.createReview));
router.post('/reviews/:id/reply', requireAuth, validate(schemas.reviewReply), asyncHandler(booking.replyReview));

router.get('/favorites', requireAuth, asyncHandler(account.listFavorites));
router.post('/favorites', requireAuth, validate(schemas.favorite), asyncHandler(account.toggleFavorite));
router.get('/notifications', requireAuth, asyncHandler(account.listNotifications));
router.post('/notifications/read', requireAuth, asyncHandler(account.readNotifications));
router.get('/messages', requireAuth, asyncHandler(account.listThreads));
router.post('/messages', requireAuth, validate(schemas.messageThread), asyncHandler(account.createThread));
router.get('/messages/:id', requireAuth, asyncHandler(account.getThread));
router.post('/messages/:id', requireAuth, validate(schemas.message), asyncHandler(account.postMessage));

router.get('/business/workspace', requireAuth, asyncHandler(account.myWorkspace));
router.get('/business/stats', requireAuth, asyncHandler(account.businessHome));
router.get('/business/clients', requireAuth, asyncHandler(account.listClients));
router.patch('/business/clients/:id', requireAuth, validate(schemas.notes), asyncHandler(account.patchClient));

router.post('/uploads', requireAuth, uploadController.upload.single('file'), asyncHandler(uploadController.sendFile));

router.get('/business/resources', requireAuth, asyncHandler(desk.resources));
router.post('/business/resources', requireAuth, validate(ops.resource), asyncHandler(desk.createResource));
router.delete('/business/resources/:id', requireAuth, asyncHandler(desk.removeResource));
router.post('/business/clients/:id/photos', requireAuth, validate(ops.photo), asyncHandler(desk.addPhoto));
router.post('/business/clients/:id/formulas', requireAuth, validate(ops.formula), asyncHandler(desk.addFormula));
router.post('/business/clients/:id/deposit', requireAuth, validate(ops.deposit), asyncHandler(desk.topUpDeposit));
router.get('/business/waitlist', requireAuth, asyncHandler(desk.waitlist));
router.post('/business/waitlist', requireAuth, validate(ops.wait), asyncHandler(desk.createWait));
router.patch('/business/waitlist/:id', requireAuth, validate(ops.waitPatch), asyncHandler(desk.patchWait));
router.get('/business/closures', requireAuth, asyncHandler(desk.closures));
router.post('/business/closures', requireAuth, validate(ops.closure), asyncHandler(desk.createClosure));
router.delete('/business/closures/:id', requireAuth, asyncHandler(desk.removeClosure));
router.delete('/business/photos/:id', requireAuth, asyncHandler(desk.removePhoto));
router.get('/business/products', requireAuth, asyncHandler(desk.products));
router.post('/business/products', requireAuth, validate(ops.product), asyncHandler(desk.createProduct));
router.post('/business/products/:id/stock', requireAuth, validate(ops.stock), asyncHandler(desk.moveStock));
router.get('/business/finance', requireAuth, asyncHandler(desk.finance));
router.post('/business/finance', requireAuth, validate(ops.ledger), asyncHandler(desk.addLedger));
router.get('/business/sales', requireAuth, asyncHandler(desk.sales));
router.post('/business/sales', requireAuth, validate(ops.sale), asyncHandler(desk.createSale));
router.get('/business/certificates', requireAuth, asyncHandler(desk.certificates));
router.post('/business/certificates', requireAuth, validate(ops.certificate), asyncHandler(desk.createCertificate));
router.get('/business/abonements', requireAuth, asyncHandler(desk.plans));
router.post('/business/abonements/plans', requireAuth, validate(ops.plan), asyncHandler(desk.createPlan));
router.post('/business/abonements', requireAuth, validate(ops.sellPlan), asyncHandler(desk.sellPlan));
router.get('/business/payroll', requireAuth, asyncHandler(desk.payroll));
router.put('/business/payroll/:id', requireAuth, validate(ops.payroll), asyncHandler(desk.savePayroll));
router.post('/business/payroll/run', requireAuth, validate(ops.payrollRun), asyncHandler(desk.runPayroll));
router.get('/business/channels', requireAuth, asyncHandler(desk.channels));
router.put('/business/channels', requireAuth, validate(ops.channels), asyncHandler(desk.saveChannels));
router.post('/business/calls', requireAuth, validate(ops.call), asyncHandler(desk.addCall));
router.post('/business/outreach', requireAuth, validate(ops.outreach), asyncHandler(desk.outreach));
router.post('/business/outbox/:id/sent', requireAuth, asyncHandler(desk.markOutbox));
router.get('/business/chat', requireAuth, asyncHandler(desk.chat));
router.post('/business/chat', requireAuth, validate(ops.chat), asyncHandler(desk.postChat));
router.get('/business/members', requireAuth, asyncHandler(desk.members));
router.post('/business/members', requireAuth, validate(ops.member), asyncHandler(desk.createMember));
router.delete('/business/members/:id', requireAuth, asyncHandler(desk.removeMember));

router.get('/business/riders', requireAuth, asyncHandler(rider.list));
router.post('/business/riders', requireAuth, asyncHandler(rider.create));
router.put('/business/riders/:id', requireAuth, asyncHandler(rider.update));
router.delete('/business/riders/:id', requireAuth, asyncHandler(rider.remove));
router.get('/business/riders/:id/answers', requireAuth, asyncHandler(rider.answers));
router.get('/riders/:slug', asyncHandler(rider.publicRider));
router.post('/riders/:slug', writeLimit, asyncHandler(rider.submit));

const guard = [requireAuth, requireRoles('SUPER_ADMIN')];
router.get('/admin/users', ...guard, asyncHandler(admin.users));
router.patch('/admin/users/:id', ...guard, validate(schemas.ban), asyncHandler(admin.banUser));
router.get('/admin/salons', ...guard, asyncHandler(admin.salons));
router.patch('/admin/salons/:id', ...guard, validate(schemas.verifyFlag), asyncHandler(admin.verifySalon));
router.delete('/admin/salons/:id', ...guard, asyncHandler(admin.removeSalon));
router.get('/admin/masters', ...guard, asyncHandler(admin.masters));
router.patch('/admin/masters/:id', ...guard, validate(schemas.verifyFlag), asyncHandler(admin.verifyMaster));
router.get('/admin/bookings', ...guard, asyncHandler(admin.bookings));
router.get('/admin/reviews', ...guard, asyncHandler(admin.reviews));
router.delete('/admin/reviews/:id', ...guard, asyncHandler(admin.removeReview));
router.get('/admin/reports', ...guard, asyncHandler(admin.reports));
router.get('/admin/categories', ...guard, asyncHandler(admin.categories));
router.post('/admin/categories', ...guard, validate(schemas.category), asyncHandler(admin.createCategory));
router.patch('/admin/categories/:id', ...guard, validate(schemas.category), asyncHandler(admin.patchCategory));
router.delete('/admin/categories/:id', ...guard, asyncHandler(admin.removeCategory));
router.get('/admin/settings', ...guard, asyncHandler(admin.settings));
router.put('/admin/settings', ...guard, validate(schemas.setting), asyncHandler(admin.putSetting));

module.exports = router;
