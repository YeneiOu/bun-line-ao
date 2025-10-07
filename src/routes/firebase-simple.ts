import { Elysia, t } from "elysia";
import { firebaseService } from "../services/firebase";
import { ResponseSuccess, ResponseError } from "../utils/response";

export const firebaseSimpleRoutes = new Elysia({ prefix: "/api" })
  // Simple health check
  .get("/health", () => ResponseSuccess(0, "Firebase service is healthy", null))

  // Coaches routes (public)
  .get("/coaches", async () => {
    try {
      const coaches = await firebaseService.getAllCoaches();
      return ResponseSuccess(0, "Coaches retrieved successfully", coaches);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return ResponseError(500, "Internal Server Error", message);
    }
  })

  .get("/coaches/:id", async ({ params: { id } }) => {
    try {
      const coach = await firebaseService.getCoach(id);
      if (!coach) {
        return ResponseError(404, "Coach not found", null);
      }
      return ResponseSuccess(0, "Coach retrieved successfully", coach);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return ResponseError(500, "Internal Server Error", message);
    }
  })

  // Prices routes (public)
  .get(
    "/prices",
    async ({ query }) => {
      try {
        const prices = await firebaseService.getPrices(query.date);
        return ResponseSuccess(0, "Prices retrieved successfully", prices);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return ResponseError(500, "Internal Server Error", message);
      }
    },
    {
      query: t.Object({
        date: t.Optional(t.String()),
      }),
    }
  )

  // Settings routes (public read)
  .get("/settings/appearance", async () => {
    try {
      const settings = await firebaseService.getAppearanceSettings();
      return ResponseSuccess(
        0,
        "Appearance settings retrieved successfully",
        settings
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return ResponseError(500, "Internal Server Error", message);
    }
  })

  // Create reservation (simplified - no auth for demo)
  .post(
    "/reservations",
    async ({ body }) => {
      try {
        // For demo purposes, using a dummy user ID
        const userId = body.userId || "demo-user";
        const reservationId = await firebaseService.createReservation(userId, {
          coachId: body.coachId,
          date: body.date,
          timeSlot: body.timeSlot,
          notes: body.notes,
        });
        return ResponseSuccess(0, "Reservation created successfully", {
          id: reservationId,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return ResponseError(500, "Internal Server Error", message);
      }
    },
    {
      body: t.Object({
        userId: t.Optional(t.String()),
        coachId: t.String(),
        date: t.String(),
        timeSlot: t.String(),
        notes: t.Optional(t.String()),
      }),
    }
  )

  // Get reservation
  .get("/reservations/:id", async ({ params: { id } }) => {
    try {
      const reservation = await firebaseService.getReservation(id);
      if (!reservation) {
        return ResponseError(404, "Reservation not found", null);
      }
      return ResponseSuccess(
        0,
        "Reservation retrieved successfully",
        reservation
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return ResponseError(500, "Internal Server Error", message);
    }
  });
