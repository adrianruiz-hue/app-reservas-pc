import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to trigger Google Chat webhook
  app.post("/api/notify-booking", async (req, res) => {
    try {
      const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
      
      if (!webhookUrl) {
        return res.status(400).json({ error: "GOOGLE_CHAT_WEBHOOK_URL environment variable is not set." });
      }

      const { booking } = req.body;

      if (!booking) {
        return res.status(400).json({ error: "Booking data is required." });
      }

      const message = {
        cardsV2: [
          {
            cardId: "bookingCard",
            card: {
              header: {
                title: "Nueva Reserva de Equipo",
                subtitle: `Reservado por: ${booking.userName}`,
                imageUrl: "https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/event/default/24px.svg",
                imageType: "CIRCLE"
              },
              sections: [
                {
                  widgets: [
                    {
                      decoratedText: {
                        topLabel: "Equipo",
                        text: booking.equipmentId === 'eq-1' ? 'Oscilloscope 7000x' : booking.equipmentId === 'eq-2' ? 'Spectrum Analyzer' : 'Thermal Chamber',
                        startIcon: { knownIcon: "CONFIRMATION_NUMBER_ICON" }
                      }
                    },
                    {
                      decoratedText: {
                        topLabel: "Fecha",
                        text: booking.date,
                        startIcon: { knownIcon: "EVENT" }
                      }
                    },
                    {
                      decoratedText: {
                        topLabel: "Horario",
                        text: `${booking.startTime} - ${booking.endTime}`,
                        startIcon: { knownIcon: "CLOCK" }
                      }
                    },
                    {
                      decoratedText: {
                        topLabel: "Motivo / Observación",
                        text: booking.purpose || "Uso de equipo",
                        startIcon: { knownIcon: "DESCRIPTION" },
                        wrapText: true
                      }
                    }
                  ]
                }
              ]
            }
          }
        ]
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Chat Webhook error:", errorText);
        return res.status(response.status).json({ error: "Failed to send notification" });
      }

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
