import type { Business } from "@/actions/business";

export const DUMMY_BUSINESSES: Business[] = [
  {
    id: "dummy-1",
    businessName: "Paws & Claws Pet Care",
    businessType: "Pet Care",
    services: "care",
    serviceHours: "Mon–Sat 8:00 AM – 8:00 PM, Sun 10:00 AM – 6:00 PM",
    businessDescription:
      "Full-service pet care with grooming, daycare, and veterinary support. We treat your furry family members with love and professional care. Modern facility with indoor play areas and trained staff. Book a tour or drop in for a meet-and-greet—we’re here to make every pet feel at home.",
    serviceAreas: "Downtown, Westside, Riverside",
    images: [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop",
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "dummy-2",
    businessName: "The Green Bowl Café",
    businessType: "Restaurant",
    services: "food",
    serviceHours: "7:00 AM – 10:00 PM daily",
    businessDescription:
      "Organic, locally sourced meals for you and your pet. Our menu features human-grade pet-friendly bowls alongside specialty coffee and brunch. A cozy spot where every member of the family is welcome. Reservations recommended on weekends.",
    serviceAreas: "Midtown, East End, Harbor District",
    images: [
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "dummy-3",
    businessName: "Luxe Pet Spa & Grooming",
    businessType: "Grooming",
    services: "groom",
    serviceHours: "Tue–Sun 9:00 AM – 7:00 PM",
    businessDescription:
      "Premium grooming and spa treatments for dogs and cats. We use only natural, cruelty-free products. Services include breed-specific cuts, nail trimming, teeth cleaning, and relaxing spa baths. Walk-ins welcome subject to availability.",
    serviceAreas: "Northside, Lakeside, Central",
    images: [
      "https://images.unsplash.com/photo-1625314897518-2d1c4c420f6e?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop",
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function getDummyBusinessById(id: string): Business | null {
  return DUMMY_BUSINESSES.find((b) => b.id === id) ?? null;
}
