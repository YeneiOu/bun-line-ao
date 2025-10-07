import { Elysia, t } from "elysia";
import { firebaseService } from "../services/firebase";
import {
  authMiddleware,
  adminAuthMiddleware,
  coachAuthMiddleware,
} from "../middleware/auth";
import { ResponseSuccess, ResponseError } from "../utils/response";
import {
  CalendarDayData,
  CalendarResponse,
  TimeSlot,
  DateAvailabilityResponse,
} from "../types/firebase";
import cors from "@elysiajs/cors";

// Simple test middleware
const testMiddleware = new Elysia({ name: "test" }).derive(() => {
  console.log("🧪 Test middleware called!");
  return { testValue: "middleware works" };
});

export const firebaseRoutes = new Elysia({ prefix: "/api" })
  .use(cors())
  // Reservations routes
  .group("/reservations", (app) =>
    app
      // Get all reservations (admin/coach only)
      .get("/", async ({ request, set }) => {
        const authHeader = request.headers.get("authorization");

        if (!authHeader?.startsWith("Bearer ")) {
          console.log(
            "❌ Missing or invalid authorization header:",
            authHeader
          );
          set.status = 401;
          return ResponseError(
            401,
            {
              code: 1,
              message: "Unauthorized, Missing or invalid authorization header",
            },
            null
          );
        }

        const token = authHeader.split(" ")[1];

        try {
          let reservations;
          if (token) {
            reservations = await firebaseService.getAllReservations();
          }
          console.log("reservations", reservations);
          return ResponseSuccess(
            200,
            { code: 0, message: "All reservations retrieved successfully" },
            reservations
          );
          // console.log("user", user);
          // // Check if user exists
          // if (!user) {
          //   return ResponseError(
          //     401,
          //     { code: 1, message: "Unauthorized" },
          //     "Authentication required",
          //   );
          // }
          // // Only admin and coaches can view all reservations
          // if (user.role !== "admin" && user.role !== "coach") {
          //   return ResponseError(
          //     403,
          //     { code: 1, message: "Forbidden" },
          //     "Only admins and coaches can view all reservations",
          //   );
          // }
          // let reservations;
          // if (user.role === "admin") {
          //   // Admin can see all reservations
          //   reservations = await firebaseService.getAllReservations();
          // } else if (user.role === "coach") {
          //   // Coach can see only their assigned reservations
          //   reservations = await firebaseService.getCoachReservations(user.uid);
          // }
          // console.log("reservations", reservations);
          // return ResponseSuccess(
          //   200,
          //   { code: 0, message: "All reservations retrieved successfully" },
          //   reservations,
          // );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      })
      .use(cors())
      .post(
        "/",
        async ({ body }) => {
          console.log("🔥 Create reservation called!");
          console.log("body!", body);

          try {
            const reservationId = await firebaseService.createReservation(body);
            console.log("Reservation ID:", reservationId);
            if (reservationId) {
              return ResponseSuccess(
                200,
                { code: 0, message: "Reservation created successfully" },
                {
                  id: reservationId,
                }
              );
            }
            return ResponseError(
              400,
              { code: 1, message: "Bad Request, Failed to create reservation" },
              null
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            return ResponseError(
              500,
              { code: 1, message: "Internal Server Error" },
              message
            );
          }
        },
        {
          body: t.Object({
            userId: t.String(),
            coachId: t.String(),
            date: t.String(),
            email: t.String(),
            holdExpiresAt: t.Number(),
            mobile: t.String(),
            name: t.String(),
            price: t.Number(),
            status: t.String(),
            time: t.Number(),
            userLineName: t.String(),
            userLineId: t.String(),
            userLineUrl: t.String(),
            createdAt: t.Number(),
            updatedAt: t.Number(),
            payslipUrl: t.String(),
          }),
        }
      )
      .use(cors())
      .get("/my", async ({ query }) => {
        console.log("query", query);
        const id: string = query.id;

        try {
          const reservations = await firebaseService.getUserReservations(id);
          return ResponseSuccess(
            200,
            { code: 0, message: "Reservations retrieved successfully" },
            reservations
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      })
      .get("/:id", async ({ params: { id }, user }) => {
        try {
          const reservation = await firebaseService.getReservation(id);
          if (!reservation) {
            return ResponseError(
              404,
              { code: 1, message: "Not Found Reservation not found" },
              null
            );
          }

          // Check if user owns the reservation or is admin/coach
          if (
            reservation.userId !== user.uid &&
            user.role !== "admin" &&
            user.role !== "coach"
          ) {
            return ResponseError(
              403,
              { code: 1, message: "Forbidden" },
              "Forbidden"
            );
          }

          return ResponseSuccess(
            200,
            { code: 0, message: "Reservation retrieved successfully" },
            reservation
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      })
      .patch(
        "/:id",
        async ({ params: { id }, body }) => {
          try {
            const reservation = await firebaseService.getReservation(id);
            if (!reservation) {
              return ResponseError(
                404,
                { code: 1, message: "Not Found" },
                null
              );
            }

            // Check permissions
            // if (
            //   reservation.userId !== user.uid &&
            //   user.role !== "admin" &&
            //   user.role !== "coach"
            // ) {
            //   return ResponseError(
            //     403,
            //     { code: 1, message: "Forbidden" },
            //     null,
            //   );
            // }

            await firebaseService.updateReservation(id, body);
            return ResponseSuccess(
              200,
              { code: 0, message: "Reservation updated successfully" },
              reservation
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            return ResponseError(
              500,
              { code: 1, message: "Internal Server Error" },
              message
            );
          }
        },
        {
          body: t.Object({
            status: t.String(),

            updatedAt: t.Number(),
            payslipUrl: t.String(),
          }),
        }
      )
      .delete("/:id", async ({ params: { id }, user }) => {
        try {
          const reservation = await firebaseService.getReservation(id);
          if (!reservation) {
            return ResponseError(
              404,
              { code: 1, message: "Not Found, Reservation not found" },
              null
            );
          }

          // Check permissions
          if (reservation.userId !== user.uid && user.role !== "admin") {
            return ResponseError(
              403,
              { code: 1, message: "Forbidden" },
              "Forbidden"
            );
          }

          await firebaseService.deleteReservation(id);
          return ResponseSuccess(
            200,
            { code: 0, message: "Reservation deleted successfully" },
            null
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      })
  )

  // Coaches routes
  .group("/coaches", (app) =>
    app
      .get("/", async () => {
        try {
          const coaches = await firebaseService.getAllCoaches();
          return ResponseSuccess(
            200,
            { code: 0, message: "Coaches retrieved successfully" },
            coaches
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      })
      .get("/:id", async ({ params: { id } }) => {
        try {
          const coach = await firebaseService.getCoach(id);
          if (!coach) {
            return ResponseError(
              404,
              { code: 1, message: "Not Found, Coach not found" },
              null
            );
          }
          return ResponseSuccess(
            200,
            { code: 0, message: "Coach retrieved successfully" },
            coach
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      })
      .use(adminAuthMiddleware)
      .post(
        "/",
        async ({ body }) => {
          try {
            const coachId = await firebaseService.createCoach(body);
            return ResponseSuccess(
              200,
              { code: 0, message: "Coach created successfully" },
              {
                id: coachId,
              }
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            return ResponseError(
              500,
              { code: 1, message: "Internal Server Error" },
              message
            );
          }
        },
        {
          body: t.Object({
            name: t.String(),
            email: t.String(),
            phone: t.Optional(t.String()),
            specialties: t.Array(t.String()),
            bio: t.Optional(t.String()),
          }),
        }
      )
      .patch(
        "/:id",
        async ({ params: { id }, body }) => {
          try {
            const coach = await firebaseService.getCoach(id);
            if (!coach) {
              return ResponseError(
                404,
                { code: 1, message: "Not Found, Coach not found" },
                null
              );
            }

            await firebaseService.updateCoach(id, body);
            return ResponseSuccess(
              200,
              { code: 0, message: "Coach updated successfully" },
              null
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            return ResponseError(
              500,
              { code: 1, message: "Internal Server Error" },
              message
            );
          }
        },
        {
          body: t.Object({
            name: t.Optional(t.String()),
            email: t.Optional(t.String()),
            phone: t.Optional(t.String()),
            specialties: t.Optional(t.Array(t.String())),
            bio: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
          }),
        }
      )
  )

  // Pricing routes
  .group("/prices", (app) =>
    app
      .get(
        "/",
        async ({ query }) => {
          try {
            const prices = await firebaseService.getPrices(query.date);
            return ResponseSuccess(
              200,
              { code: 0, message: "Prices retrieved successfully" },
              prices
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            return ResponseError(
              500,
              { code: 1, message: "Internal Server Error" },
              message
            );
          }
        },
        {
          query: t.Object({
            date: t.Optional(t.String()),
          }),
        }
      )
      .use(adminAuthMiddleware)
      .post(
        "/:date",
        async ({ params: { date }, body }) => {
          try {
            await firebaseService.setPrices(date, body);
            return ResponseSuccess(
              200,
              { code: 0, message: "Prices updated successfully" },
              null
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            return ResponseError(
              500,
              { code: 1, message: "Internal Server Error" },
              message
            );
          }
        },
        {
          body: t.Record(
            t.String(),
            t.Object({
              price: t.Number(),
              currency: t.String(),
              coachId: t.Optional(t.String()),
            })
          ),
        }
      )
  )

  // Settings routes
  .group("/settings", (app) =>
    app

      .get("/appearance", async () => {
        try {
          const settings = await firebaseService.getAppearanceSettings();
          return ResponseSuccess(
            200,
            { code: 0, message: "Appearance settings retrieved successfully" },
            settings
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      })
      .get("/equipment", async () => {
        try {
          const settings = await firebaseService.getEquipmentSettings();
          return ResponseSuccess(
            200,
            { code: 0, message: "Equipment settings retrieved successfully" },
            settings
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      })
      .use(adminAuthMiddleware)
      .patch(
        "/appearance",
        async ({ body }) => {
          try {
            await firebaseService.updateAppearanceSettings(body);
            return ResponseSuccess(
              200,
              { code: 0, message: "Appearance settings updated successfully" },
              null
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            return ResponseError(
              500,
              { code: 1, message: "Internal Server Error" },
              message
            );
          }
        },
        {
          body: t.Object({
            primaryColor: t.Optional(t.String()),
            secondaryColor: t.Optional(t.String()),
            logo: t.Optional(t.String()),
            companyName: t.Optional(t.String()),
            storagePath: t.Optional(t.String()),
            theme: t.Optional(
              t.Union([
                t.Literal("light"),
                t.Literal("dark"),
                t.Literal("auto"),
              ])
            ),
          }),
        }
      )
      .patch(
        "/equipment",
        async ({ body }) => {
          try {
            await firebaseService.updateEquipmentSettings(body);
            return ResponseSuccess(
              200,
              { code: 0, message: "Equipment settings updated successfully" },
              null
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            return ResponseError(
              500,
              { code: 1, message: "Internal Server Error" },
              message
            );
          }
        },
        {
          body: t.Object({
            totalTreadmills: t.Optional(t.Number()),
            operatingHours: t.Optional(
              t.Object({
                start: t.Number(),
                end: t.Number(),
              })
            ),
            defaultPrice: t.Optional(t.Number()),
            currency: t.Optional(t.String()),
          }),
        }
      )
  )

  // File upload routes
  .group("/upload", (app) =>
    app.use(cors()).post(
      "/payslip",
      async ({ body }) => {
        try {
          // Note: In a real implementation, you'd handle file upload differently
          // This is a simplified example
          const { file } = body;
          const downloadURL = await firebaseService.uploadPayslip(body);
          return ResponseSuccess(
            200,
            { code: 0, message: "Payslip uploaded successfully" },
            {
              url: downloadURL,
            }
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      },
      {
        body: t.Object({
          file: t.File(),
          userId: t.String(),
        }),
      }
    )
  )

  // Calendar routes
  .group("/calendar", (app) =>
    app
      .get(
        "/",
        async ({ query }) => {
          try {
            const { year, month } = query;

            // Get all reservations for the specified month/year
            const reservations = await firebaseService.getAllReservations();

            // Get equipment settings for total treadmills and operating hours
            const equipmentSettings =
              await firebaseService.getEquipmentSettings();
            const totalTreadmills = equipmentSettings?.totalTreadmills || 2;
            const operatingHours = equipmentSettings?.operatingHours || {
              start: 10,
              end: 21,
            };

            // Calculate total slots per day
            const totalSlotsPerDay =
              (operatingHours.end - operatingHours.start) * totalTreadmills;

            // Filter reservations for the requested month/year
            const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
            const endDate = new Date(parseInt(year), parseInt(month), 0)
              .toISOString()
              .split("T")[0];

            const monthReservations =
              reservations?.filter((reservation: any) => {
                return (
                  reservation.date >= startDate && reservation.date <= endDate
                );
              }) || [];

            // Group reservations by date and calculate availability
            const calendarData: { [date: string]: CalendarDayData } = {};

            // Get current date for past date checking
            const today = new Date().toISOString().split("T")[0];

            // Process each day of the month
            const daysInMonth = new Date(
              parseInt(year),
              parseInt(month),
              0
            ).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${year}-${month
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

              const dayReservations = monthReservations.filter(
                (r: any) =>
                  r.date === dateStr &&
                  (r.status === "confirmed" || r.status === "pending")
              );

              const bookedSlots = dayReservations.length;
              const availableSlots = totalSlotsPerDay - bookedSlots;

              let status: "available" | "limited" | "full" | "past";

              if (dateStr < today) {
                status = "past";
              } else if (bookedSlots === 0) {
                status = "available";
              } else if (availableSlots > 0) {
                status = "limited";
              } else {
                status = "full";
              }

              calendarData[dateStr] = {
                totalSlots: totalSlotsPerDay,
                bookedSlots,
                availableSlots,
                status,
                reservations: dayReservations,
              };
            }

            return ResponseSuccess(
              200,
              { code: 0, message: "Calendar data retrieved successfully" },
              {
                year: parseInt(year),
                month: parseInt(month),
                totalTreadmills,
                operatingHours,
                totalSlotsPerDay,
                calendarData,
              }
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            return ResponseError(
              500,
              { code: 1, message: "Internal Server Error" },
              message
            );
          }
        },
        {
          query: t.Object({
            year: t.String(),
            month: t.String(),
          }),
        }
      )
      .get("/availability/:date", async ({ params: { date } }) => {
        try {
          // Get reservations for specific date
          const reservations = await firebaseService.getAllReservations();
          const dayReservations =
            reservations?.filter(
              (r: any) =>
                r.date === date &&
                (r.status === "confirmed" || r.status === "pending")
            ) || [];

          // Get equipment settings
          const equipmentSettings =
            await firebaseService.getEquipmentSettings();
          const totalTreadmills = equipmentSettings?.totalTreadmills || 2;
          const operatingHours = equipmentSettings?.operatingHours || {
            start: 10,
            end: 21,
          };

          // Generate time slots
          const timeSlots: TimeSlot[] = [];
          for (
            let hour = operatingHours.start;
            hour < operatingHours.end;
            hour++
          ) {
            timeSlots.push({
              time: hour,
              available: totalTreadmills,
              booked: 0,
              reservations: [],
            });
          }

          // Count bookings per time slot
          dayReservations.forEach((reservation: any) => {
            const timeSlot = timeSlots.find(
              (slot) => slot.time === reservation.time
            );
            if (timeSlot) {
              timeSlot.booked++;
              timeSlot.available--;
              timeSlot.reservations.push(reservation);
            }
          });

          return ResponseSuccess(
            200,
            { code: 0, message: "Date availability retrieved successfully" },
            {
              date,
              totalTreadmills,
              operatingHours,
              timeSlots,
              totalReservations: dayReservations.length,
            }
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      })
  )

  // Admin routes
  .group("/admin", (app) =>
    app.use(adminAuthMiddleware).get(
      "/logs",
      async ({ query }) => {
        try {
          const logs = await firebaseService.getAdminLogs(
            query.limit ? parseInt(query.limit) : 50
          );
          return ResponseSuccess(
            200,
            { code: 0, message: "Admin logs retrieved successfully" },
            logs
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            message
          );
        }
      },
      {
        query: t.Object({
          limit: t.Optional(t.Number()),
        }),
      }
    )
  );
