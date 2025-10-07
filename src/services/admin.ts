import {
  collection,
  doc,
  getDocs,
  query,
  where,
  deleteDoc,
  writeBatch,
  addDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import type { Reservation, AdminLog } from '../types/firebase';

export interface ReservationStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  totalRevenue: number;
}

export class AdminService {
  private getCollectionPath(collectionName: string): string {
    return `artifacts/${appId}/public/data/${collectionName}`;
  }

  /**
   * Fetch all reservations from Firestore
   */
  async fetchReservations(): Promise<Reservation[]> {
    try {
      const reservationsCol = collection(db, this.getCollectionPath('reservations'));
      const snapshot = await getDocs(reservationsCol);

      const reservations: Reservation[] = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            ...data,
            id: docSnap.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as Reservation;
        })
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
          return dateB.getTime() - dateA.getTime();
        });

      return reservations;
    } catch (error) {
      console.error('Error fetching reservations:', error);
      throw new Error('Failed to fetch reservations');
    }
  }

  /**
   * Fetch reservations for a specific customer
   */
  async fetchCustomerReservations(customerId: string): Promise<Reservation[]> {
    try {
      const reservationsCol = collection(db, this.getCollectionPath('reservations'));
      const q = query(reservationsCol, where('userId', '==', customerId));
      const snapshot = await getDocs(q);

      const reservations: Reservation[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Reservation;
      });

      return reservations;
    } catch (error) {
      console.error('Error fetching customer reservations:', error);
      throw new Error('Failed to fetch customer reservations');
    }
  }

  /**
   * Get reservation statistics
   */
  async getReservationStats(): Promise<ReservationStats> {
    try {
      const reservations = await this.fetchReservations();

      const stats: ReservationStats = {
        total: reservations.length,
        confirmed: reservations.filter((r) => r.status === 'confirmed').length,
        pending: reservations.filter((r) => r.status === 'pending').length,
        cancelled: reservations.filter((r) => r.status === 'cancelled').length,
        totalRevenue: 0,
      };

      // Calculate total revenue from confirmed reservations
      // Note: You'll need to add a price field to your Reservation type if not already present
      stats.totalRevenue = reservations
        .filter((r) => r.status === 'confirmed')
        .reduce((sum, r) => {
          // Assuming you have a price field, otherwise you'll need to calculate it
          const price = (r as any).price || 0;
          return sum + price;
        }, 0);

      return stats;
    } catch (error) {
      console.error('Error getting reservation stats:', error);
      throw new Error('Failed to get reservation statistics');
    }
  }

  /**
   * Delete customer reservations (single ID or array of IDs)
   */
  async deleteCustomerReservations(reservationIds: string | string[]): Promise<void> {
    try {
      const basePath = this.getCollectionPath('reservations');

      if (Array.isArray(reservationIds)) {
        // Batch delete for multiple reservations
        const batch = writeBatch(db);

        reservationIds.forEach((id) => {
          const reservationRef = doc(db, basePath, id);
          batch.delete(reservationRef);
        });

        console.log(`Preparing to delete ${reservationIds.length} reservations...`);
        await batch.commit();
        console.log('Successfully deleted all reservations in the batch.');

        // Log admin activity
        await this.logAdminActivity(
          'Admin',
          'bulk_delete_reservations',
          `Deleted ${reservationIds.length} reservations: ${reservationIds.join(', ')}`
        );
      } else {
        // Single reservation delete
        const reservationRef = doc(db, basePath, reservationIds);
        console.log(`Preparing to delete reservation ${reservationIds}...`);
        await deleteDoc(reservationRef);
        console.log('Successfully deleted single reservation.');

        // Log admin activity
        await this.logAdminActivity(
          'Admin',
          'delete_reservation',
          `Deleted reservation: ${reservationIds}`
        );
      }
    } catch (error) {
      console.error('Error deleting customer reservations:', error);
      throw new Error('Failed to delete customer reservations');
    }
  }

  /**
   * Update reservation status
   */
  async updateReservationStatus(
    reservationId: string,
    status: 'pending' | 'confirmed' | 'cancelled',
    adminUser: string = 'Admin'
  ): Promise<void> {
    try {
      const reservationRef = doc(db, this.getCollectionPath('reservations'), reservationId);

      await updateDoc(reservationRef, {
        status: status,
        updatedAt: Timestamp.now(),
      });

      // Log admin activity
      await this.logAdminActivity(
        adminUser,
        `reservation_${status}`,
        `Reservation ${reservationId} was ${status}`
      );

      console.log(`Reservation ${reservationId} status updated to ${status}`);
    } catch (error) {
      console.error(`Error updating reservation ${reservationId}:`, error);
      throw new Error(`Failed to update reservation status`);
    }
  }

  /**
   * Update reservation with custom data
   */
  async updateReservation(
    reservationId: string,
    updateData: Partial<Reservation>,
    adminUser: string = 'Admin'
  ): Promise<void> {
    try {
      const reservationRef = doc(db, this.getCollectionPath('reservations'), reservationId);

      const dataToUpdate = {
        ...updateData,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(reservationRef, dataToUpdate);

      // Log admin activity
      await this.logAdminActivity(
        adminUser,
        'update_reservation',
        `Updated reservation ${reservationId}: ${JSON.stringify(updateData)}`
      );

      console.log(`Reservation ${reservationId} updated successfully`);
    } catch (error) {
      console.error(`Error updating reservation ${reservationId}:`, error);
      throw new Error('Failed to update reservation');
    }
  }

  /**
   * Log admin activity to Firestore
   */
  async logAdminActivity(
    adminUser: string,
    action: string,
    details: string
  ): Promise<void> {
    try {
      const logsPath = this.getCollectionPath('admin_logs');
      await addDoc(collection(db, logsPath), {
        adminUser,
        action,
        details,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error logging admin activity:', error);
      // Don't throw error for logging failures to avoid breaking main operations
    }
  }

  /**
   * Get admin activity logs
   */
  async getAdminLogs(limit: number = 50): Promise<AdminLog[]> {
    try {
      const logsCol = collection(db, this.getCollectionPath('admin_logs'));
      const snapshot = await getDocs(logsCol);

      const logs: AdminLog[] = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            ...data,
            id: docSnap.id,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
          } as AdminLog;
        })
        .sort((a, b) => {
          const dateA = a.timestamp instanceof Date ? a.timestamp : new Date();
          const dateB = b.timestamp instanceof Date ? b.timestamp : new Date();
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);

      return logs;
    } catch (error) {
      console.error('Error getting admin logs:', error);
      throw new Error('Failed to get admin logs');
    }
  }

  /**
   * Get reservations by date range
   */
  async getReservationsByDateRange(startDate: Date, endDate: Date): Promise<Reservation[]> {
    try {
      const reservationsCol = collection(db, this.getCollectionPath('reservations'));
      const q = query(
        reservationsCol,
        where('date', '>=', startDate.toISOString().split('T')[0]),
        where('date', '<=', endDate.toISOString().split('T')[0])
      );
      
      const snapshot = await getDocs(q);
      
      const reservations: Reservation[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Reservation;
      });

      return reservations;
    } catch (error) {
      console.error('Error getting reservations by date range:', error);
      throw new Error('Failed to get reservations by date range');
    }
  }

  /**
   * Get reservations by status
   */
  async getReservationsByStatus(status: 'pending' | 'confirmed' | 'cancelled'): Promise<Reservation[]> {
    try {
      const reservationsCol = collection(db, this.getCollectionPath('reservations'));
      const q = query(reservationsCol, where('status', '==', status));
      const snapshot = await getDocs(q);

      const reservations: Reservation[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Reservation;
      });

      return reservations;
    } catch (error) {
      console.error('Error getting reservations by status:', error);
      throw new Error('Failed to get reservations by status');
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();
