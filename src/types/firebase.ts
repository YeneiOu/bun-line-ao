import { Timestamp } from "firebase/firestore";

export interface Reservation {
  id: string;
  userId: string;
  coachId: string;
  date: string;
  status: "pending" | "confirmed" | "cancelled";
  price?: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Coach {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  availability: {
    [date: string]: string[]; // date -> available time slots
  };
  rating?: number;
  bio?: string;
  profileImageUrl?: string;
  isActive: boolean;
  createdAt: Timestamp | Date;
}

export interface Prices {
  [date: string]: {
    [timeSlot: string]: {
      price: number;
      currency: string;
      coachId?: string;
    };
  };
}

export interface AppearanceSettings {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  companyName?: string;
  storagePath?: string;
  theme?: "light" | "dark" | "auto";
  updatedAt?: Timestamp;
}

export interface EquipmentSettings {
  totalTreadmills: number;
  operatingHours: {
    start: number;
    end: number;
  };
  defaultPrice: number;
  currency: string;
  updatedAt?: Timestamp;
}

export interface AdminLog {
  id?: string;
  adminUser: string;
  action: string;
  details: string;
  timestamp: Timestamp | Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface User {
  id?: string;
  email?: string;
  displayName?: string;
  role: "admin" | "coach" | "customer";
  isActive: boolean;
  createdAt: Timestamp | Date;
  lastLoginAt?: Timestamp | Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request types
export interface CreateReservationRequest {
  userId: string;
  coachId: string;
  date: string;
  email: string;
  holdExpiresAt: number;
  mobile: string;
  name: string;
  price: number;
  status: string;
  time: number;
  userLineName: string;
  userLineId: string;
  userLineUrl: string;
  payslipUrl: string;
  createdAt: number;
  updatedAt: number;
}

export interface UpdateReservationRequest {
  status?: "pending" | "confirmed" | "cancelled";
  paymentStatus?: "pending" | "paid" | "refunded";
  notes?: string;
}

export interface CreateCoachRequest {
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  bio?: string;
}

export interface UpdateCoachRequest {
  name?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  bio?: string;
  isActive?: boolean;
}

// Calendar API types
export interface CalendarDayData {
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  status: 'available' | 'limited' | 'full' | 'past';
  reservations: Reservation[];
}

export interface CalendarResponse {
  year: number;
  month: number;
  totalTreadmills: number;
  operatingHours: {
    start: number;
    end: number;
  };
  totalSlotsPerDay: number;
  calendarData: { [date: string]: CalendarDayData };
}

export interface TimeSlot {
  time: number;
  available: number;
  booked: number;
  reservations: Reservation[];
}

export interface DateAvailabilityResponse {
  date: string;
  totalTreadmills: number;
  operatingHours: {
    start: number;
    end: number;
  };
  timeSlots: TimeSlot[];
  totalReservations: number;
}
