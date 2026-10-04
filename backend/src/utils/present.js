function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    profile: user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          phone: user.profile.phone,
          avatar: user.profile.avatar,
          bio: user.profile.bio,
          city: user.profile.city,
          notifyEmail: user.profile.notifyEmail,
        }
      : null,
  };
}

const masterInclude = {
  user: { select: { email: true } },
  salon: { select: { id: true, slug: true, name: true, city: true, address: true } },
  branch: { select: { id: true, name: true, address: true, city: true } },
  services: {
    include: {
      service: { include: { category: true } },
    },
  },
};

const salonCardSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  cover: true,
  logo: true,
  address: true,
  city: true,
  lat: true,
  lng: true,
  phone: true,
  rating: true,
  reviewCount: true,
  priceFrom: true,
  verified: true,
};

function presentMaster(master, extra = {}) {
  if (!master) return null;
  return {
    id: master.id,
    slug: master.slug,
    firstName: master.firstName,
    lastName: master.lastName,
    name: `${master.firstName} ${master.lastName}`,
    photo: master.photo,
    bio: master.bio,
    specialization: master.specialization,
    experienceYears: master.experienceYears,
    rating: master.rating,
    reviewCount: master.reviewCount,
    priceFrom: master.priceFrom,
    instagram: master.instagram,
    gender: master.gender,
    verified: master.verified,
    suspended: master.suspended,
    city: master.city,
    salon: master.salon || null,
    branch: master.branch || null,
    services: (master.services || []).map((link) => ({
      id: link.service.id,
      name: link.service.name,
      description: link.service.description,
      durationMin: link.durationMin || link.service.durationMin,
      price: link.price ?? link.service.price,
      active: link.service.active,
      category: link.service.category,
    })),
    ...extra,
  };
}

module.exports = { publicUser, masterInclude, salonCardSelect, presentMaster };
