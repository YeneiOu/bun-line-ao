import { Elysia, t } from "elysia";
import { adminService } from "../services/admin";
import { adminAuthMiddleware } from "../middleware/auth";
import { ResponseSuccess, ResponseError } from "../utils/response";

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(adminAuthMiddleware)

  // Get all reservations
  .get("/reservations", async () => {
    try {
      const reservations = await adminService.fetchReservations();
      return ResponseSuccess(
        0,
        "Reservations retrieved successfully",
        reservations
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return ResponseError(500, "Internal Server Error", message);
    }
  })

  // Get reservations by customer ID
  .get(
    "/reservations/customer/:customerId",
    async ({ params: { customerId } }) => {
      try {
        const reservations = await adminService.fetchCustomerReservations(
          customerId
        );
        return ResponseSuccess(
          0,
          "Customer reservations retrieved successfully",
          reservations
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return ResponseError(500, "Internal Server Error", message);
      }
    }
  )

  // Get reservation statistics
  .get("/stats", async () => {
    try {
      const stats = await adminService.getReservationStats();
      return ResponseSuccess(0, "Statistics retrieved successfully", stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return ResponseError(500, "Internal Server Error", message);
    }
  })

  // Update reservation status
  .patch(
    "/reservations/:id/status",
    async ({ params: { id }, body, user }) => {
      try {
        await adminService.updateReservationStatus(
          id,
          body.status,
          user.email || user.uid
        );
        return ResponseSuccess(
          0,
          "Reservation status updated successfully",
          null
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return ResponseError(500, "Internal Server Error", message);
      }
    },
    {
      body: t.Object({
        status: t.Union([
          t.Literal("pending"),
          t.Literal("confirmed"),
          t.Literal("cancelled"),
        ]),
      }),
    }
  )

  // Update reservation with custom data
  .patch(
    "/reservations/:id",
    async ({ params: { id }, body, user }) => {
      try {
        await adminService.updateReservation(id, body, user.email || user.uid);
        return ResponseSuccess(0, "Reservation updated successfully", null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return ResponseError(500, "Internal Server Error", message);
      }
    },
    {
      body: t.Object({
        status: t.Optional(
          t.Union([
            t.Literal("pending"),
            t.Literal("confirmed"),
            t.Literal("cancelled"),
          ])
        ),
        paymentStatus: t.Optional(
          t.Union([
            t.Literal("pending"),
            t.Literal("paid"),
            t.Literal("refunded"),
          ])
        ),
        notes: t.Optional(t.String()),
        date: t.Optional(t.String()),
        timeSlot: t.Optional(t.String()),
        coachId: t.Optional(t.String()),
      }),
    }
  )

  // Delete single reservation
  .delete("/reservations/:id", async ({ params: { id }, user }) => {
    try {
      await adminService.deleteCustomerReservations(id);
      return ResponseSuccess(0, "Reservation deleted successfully", null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return ResponseError(500, "Internal Server Error", message);
    }
  })

  // Bulk delete reservations
  .delete(
    "/reservations",
    async ({ body, user }) => {
      try {
        await adminService.deleteCustomerReservations(body.reservationIds);
        return ResponseSuccess(
          0,
          `${body.reservationIds.length} reservations deleted successfully`,
          null
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return ResponseError(500, "Internal Server Error", message);
      }
    },
    {
      body: t.Object({
        reservationIds: t.Array(t.String()),
      }),
    }
  )

  // Get reservations by status
  .get("/reservations/status/:status", async ({ params: { status } }) => {
    try {
      const reservations = await adminService.getReservationsByStatus(
        status as any
      );
      return ResponseSuccess(
        0,
        `${status} reservations retrieved successfully`,
        reservations
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return ResponseError(500, "Internal Server Error", message);
    }
  })

  // Get reservations by date range
  .get(
    "/reservations/date-range",
    async ({ query }) => {
      try {
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);

        const reservations = await adminService.getReservationsByDateRange(
          startDate,
          endDate
        );
        return ResponseSuccess(
          0,
          "Reservations retrieved successfully",
          reservations
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return ResponseError(500, "Internal Server Error", message);
      }
    },
    {
      query: t.Object({
        startDate: t.String(),
        endDate: t.String(),
      }),
    }
  )

  // Get admin activity logs
  .get(
    "/logs",
    async ({ query }) => {
      try {
        const limit = query.limit ? parseInt(query.limit) : 50;
        const logs = await adminService.getAdminLogs(limit);
        return ResponseSuccess(0, "Admin logs retrieved successfully", logs);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return ResponseError(500, "Internal Server Error", message);
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
    }
  )

  // Log custom admin activity
  .post(
    "/logs",
    async ({ body, user }) => {
      try {
        await adminService.logAdminActivity(
          user.email || user.uid,
          body.action,
          body.details
        );
        return ResponseSuccess(0, "Admin activity logged successfully", null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return ResponseError(500, "Internal Server Error", message);
      }
    },
    {
      body: t.Object({
        action: t.String(),
        details: t.String(),
      }),
    }
  );
