import { User, Seller } from "@/types";

export const buyers: User[] = [
  {
    id: "buyer-1",
    name: "Carlos Mendoza",
    email: "carlos@email.com",
    role: "buyer",
    createdAt: "2025-11-10T08:00:00Z",
    isActive: true,
  },
  {
    id: "buyer-2",
    name: "Maria Gutierrez",
    email: "maria@email.com",
    role: "buyer",
    createdAt: "2025-12-05T14:00:00Z",
    isActive: true,
  },
  {
    id: "buyer-3",
    name: "Jose Rojas",
    email: "jose@email.com",
    role: "buyer",
    createdAt: "2026-01-02T10:00:00Z",
    isActive: true,
  },
];

export const sellers: Seller[] = [
  {
    id: "seller-1",
    name: "Roberto Flores",
    email: "roberto@digitalkeys.bo",
    role: "seller",
    storeName: "DigitalKeys Bolivia",
    commissionRate: 10,
    totalSales: 756,
    totalEarnings: 18450.00,
    rating: 4.8,
    totalReviews: 423,
    isVerified: true,
    createdAt: "2025-10-01T08:00:00Z",
    isActive: true,
  },
  {
    id: "seller-2",
    name: "Ana Quispe",
    email: "ana@giftcardexpress.bo",
    role: "seller",
    storeName: "GiftCard Express",
    commissionRate: 12,
    totalSales: 1245,
    totalEarnings: 24300.00,
    rating: 4.6,
    totalReviews: 678,
    isVerified: true,
    createdAt: "2025-09-15T10:00:00Z",
    isActive: true,
  },
  {
    id: "seller-3",
    name: "Diego Mamani",
    email: "diego@codevaultpro.com",
    role: "seller",
    storeName: "CodeVault Pro",
    commissionRate: 15,
    totalSales: 567,
    totalEarnings: 12890.00,
    rating: 4.9,
    totalReviews: 312,
    isVerified: true,
    createdAt: "2025-11-20T12:00:00Z",
    isActive: true,
  },
];

export const admin: User = {
  id: "admin-1",
  name: "Admin VendorVault",
  email: "admin@vendorvault.com",
  role: "admin",
  createdAt: "2025-08-01T00:00:00Z",
  isActive: true,
};

export const allUsers: User[] = [...buyers, ...sellers, admin];
