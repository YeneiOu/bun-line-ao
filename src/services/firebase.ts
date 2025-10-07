import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage, adminDb, appId } from "../config/firebase";
import type {
  Reservation,
  Coach,
  Prices,
  AppearanceSettings,
  EquipmentSettings,
  AdminLog,
  User,
  CreateReservationRequest,
  UpdateReservationRequest,
  CreateCoachRequest,
  UpdateCoachRequest,
} from "../types/firebase";

export class FirebaseService {
  private getCollectionPath(collectionName: string): string {
    return `artifacts/${appId}/public/data/${collectionName}`;
  }

  // Reservation methods
  async createReservation(data: CreateReservationRequest): Promise<string> {
    try {
      const reservationData: Omit<CreateReservationRequest, "userId"> = {
        ...data,
      };

      const docRef = await addDoc(
        collection(db, this.getCollectionPath("reservations")),
        reservationData,
      );

      // Log admin activity
      await this.logAdminActivity(
        "system",
        "create_reservation",
        `Created reservation ${docRef.id} for user ${data.userId}`,
      );

      return docRef.id;
    } catch (error) {
      console.error("Error creating reservation:", error);
      throw new Error("Failed to create reservation");
    }
  }

  async getReservation(id: string): Promise<Reservation | null> {
    try {
      const docRef = doc(db, this.getCollectionPath("reservations"), id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Reservation;
      }
      return null;
    } catch (error) {
      console.error("Error getting reservation:", error);
      throw new Error("Failed to get reservation");
    }
  }

  async getUserReservations(userLineId: string): Promise<Reservation[]> {
    try {
      const q = query(
        collection(db, this.getCollectionPath("reservations")),
        where("userLineId", "==", userLineId),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];
    } catch (error) {
      console.error("Error getting user reservations:", error);
      throw new Error("Failed to get user reservations");
    }
  }

  async updateReservation(
    id: string,
    data: CreateReservationRequest,
  ): Promise<void> {
    try {
      const docRef = doc(db, this.getCollectionPath("reservations"), id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });

      await this.logAdminActivity(
        "system",
        "update_reservation",
        `Updated reservation ${id}`,
      );
    } catch (error) {
      console.error("Error updating reservation:", error);
      throw new Error("Failed to update reservation");
    }
  }

  async deleteReservation(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.getCollectionPath("reservations"), id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting reservation:", error);
      throw new Error("Failed to delete reservation");
    }
  }

  async getAllReservations(): Promise<Reservation[]> {
    try {
      const q = query(
        collection(db, this.getCollectionPath("reservations")),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Reservation,
      );
    } catch (error) {
      console.error("Error getting all reservations:", error);
      throw error;
    }
  }

  async getCoachReservations(coachId: string): Promise<Reservation[]> {
    try {
      const q = query(
        collection(db, this.getCollectionPath("reservations")),
        where("coachId", "==", coachId),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Reservation,
      );
    } catch (error) {
      console.error("Error getting coach reservations:", error);
      throw error;
    }
  }

  // Coach methods
  async createCoach(data: CreateCoachRequest): Promise<string> {
    try {
      const coachData: Omit<Coach, "id"> = {
        ...data,
        availability: {},
        isActive: true,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, this.getCollectionPath("coaches")),
        coachData,
      );

      await this.logAdminActivity(
        "system",
        "create_coach",
        `Created coach ${docRef.id}`,
      );

      return docRef.id;
    } catch (error) {
      console.error("Error creating coach:", error);
      throw new Error("Failed to create coach");
    }
  }

  async getCoach(id: string): Promise<Coach | null> {
    try {
      const docRef = doc(db, this.getCollectionPath("coaches"), id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Coach;
      }
      return null;
    } catch (error) {
      console.error("Error getting coach:", error);
      throw new Error("Failed to get coach");
    }
  }

  async getAllCoaches(): Promise<Coach[]> {
    try {
      const querySnapshot = await getDocs(
        collection(db, this.getCollectionPath("coaches")),
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Coach[];
    } catch (error) {
      console.error("Error getting coaches:", error);
      throw new Error("Failed to get coaches");
    }
  }

  async updateCoach(id: string, data: UpdateCoachRequest): Promise<void> {
    try {
      const docRef = doc(db, this.getCollectionPath("coaches"), id);
      await updateDoc(docRef, data as any);

      await this.logAdminActivity(
        "system",
        "update_coach",
        `Updated coach ${id}`,
      );
    } catch (error) {
      console.error("Error updating coach:", error);
      throw new Error("Failed to update coach");
    }
  }

  // File upload methods
  async uploadPayslip(body: { file: File; userId: string }): Promise<string> {
    try {
      const storagePath = `artifacts/${appId}/public/payslips/${body.userId}_${Date.now()}_${body.file.name}`;
      const fileRef = storageRef(storage, storagePath);

      const snapshot = await uploadBytes(fileRef, body.file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await this.logAdminActivity(
        "system",
        "upload_payslip",
        `Uploaded payslip for user ${body.userId}`,
      );

      return downloadURL;
    } catch (error) {
      console.error("Error uploading payslip:", error);
      throw new Error("Failed to upload payslip");
    }
  }

  // Settings methods
  async getAppearanceSettings(): Promise<AppearanceSettings> {
    try {
      const docRef = doc(db, this.getCollectionPath("settings"), "appearance");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as AppearanceSettings;
      }
      return {};
    } catch (error) {
      console.error("Error getting appearance settings:", error);
      throw new Error("Failed to get appearance settings");
    }
  }

  async updateAppearanceSettings(
    data: Partial<AppearanceSettings>,
  ): Promise<void> {
    try {
      const docRef = doc(db, this.getCollectionPath("settings"), "appearance");
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating appearance settings:", error);
      throw new Error("Failed to update appearance settings");
    }
  }

  // Equipment settings
  async getEquipmentSettings(): Promise<EquipmentSettings> {
    try {
      const docRef = doc(db, this.getCollectionPath("settings"), "equipment");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as EquipmentSettings;
      } else {
        // Return default settings if none exist
        const defaultSettings: EquipmentSettings = {
          totalTreadmills: 2,
          operatingHours: { start: 10, end: 21 },
          defaultPrice: 1200,
          currency: "THB",
          updatedAt: Timestamp.now(),
        };

        // Create default settings
        await setDoc(docRef, defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error("Error getting equipment settings:", error);
      throw new Error("Failed to get equipment settings");
    }
  }

  async updateEquipmentSettings(
    data: Partial<EquipmentSettings>,
  ): Promise<void> {
    try {
      const docRef = doc(db, this.getCollectionPath("settings"), "equipment");
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating equipment settings:", error);
      throw new Error("Failed to update equipment settings");
    }
  }

  // Pricing methods
  async setPrices(dateStr: string, priceData: any): Promise<void> {
    try {
      const docRef = doc(db, this.getCollectionPath("prices"), dateStr);
      await setDoc(docRef, priceData, { merge: true });
      await this.logAdminActivity(
        "system",
        "update_prices",
        `Updated prices for ${dateStr}`,
      );
    } catch (error) {
      console.error("Error setting prices:", error);
      throw new Error("Failed to set prices");
    }
  }

  async getPrices(dateStr?: string): Promise<Prices> {
    try {
      if (dateStr) {
        const docRef = doc(db, this.getCollectionPath("prices"), dateStr);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return { [dateStr]: docSnap.data() };
        }
        return {};
      } else {
        const querySnapshot = await getDocs(
          collection(db, this.getCollectionPath("prices")),
        );
        const prices: Prices = {};
        querySnapshot.docs.forEach((doc) => {
          prices[doc.id] = doc.data();
        });
        return prices;
      }
    } catch (error) {
      console.error("Error getting prices:", error);
      throw new Error("Failed to get prices");
    }
  }

  // Admin logging
  async logAdminActivity(
    adminUser: string,
    action: string,
    details: string,
  ): Promise<void> {
    try {
      const logData: Omit<AdminLog, "id"> = {
        adminUser,
        action,
        details,
        timestamp: Timestamp.now(),
      };

      await addDoc(
        collection(db, this.getCollectionPath("admin_logs")),
        logData,
      );
    } catch (error) {
      console.error("Error logging admin activity:", error);
      // Don't throw error for logging failures
    }
  }

  async getAdminLogs(limitCount: number = 50): Promise<AdminLog[]> {
    try {
      const q = query(
        collection(db, this.getCollectionPath("admin_logs")),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AdminLog[];
    } catch (error) {
      console.error("Error getting admin logs:", error);
      throw new Error("Failed to get admin logs");
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
