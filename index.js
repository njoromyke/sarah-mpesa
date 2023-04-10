const express = require("express");
const cors = require("cors");
const app = express();
const Mpesa = require("mpesa-api").Mpesa;
const http = require("http");
const createServer = http.createServer;
const server = createServer(app);
const { Server } = require("socket.io");
const asyncHandler = require("express-async-handler");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  transports: ["polling"],
});

const credentials = {
  clientKey: "pLc8G4bolTbxKnF2PYcGe9BG54RiyIOa",
  clientSecret: "ILmAN8j2Ji0XZ23M",
  initiatorPassword: "Safaricom979!",
  securityCredential:
    "OVE/WOc3eePOtB5dGCAkIzBm7tG+UJK2BXSpYUv5u0TX9RTuxvDHvemj+8iZdvC/+FWbORc2xTNR2bBG5AvapIAQ2pJfhmek1SoU5+J2g3gDJW8axiGHTl1kKoJEx4N5R8xT/lqUy7PXHJfa4MZOGrcql/Y1Y0TH/qiPx5p7pjEC8olIukX6271XqdcChf8hIScZgLKQB6OVCS2L2/OqsiNOSCI8rV5IFM8oSq1wEAzsGeO1wFX2Xv4Mz6wMWg3TELNseVIj+Gxnm4p/yVtxUfaW8+VUChNO7jqPTBKRrWbXKFOehoTPatiR19Mn+6AR8/INzgTREI92aeYlLbB0Cg==",
  certificatePath: null,
};

const mpesa = new Mpesa(credentials, "sandbox");

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post(
  "/mpesa",
  asyncHandler(async (req, res) => {
    const { phone } = req.body;

    try {
      await mpesa.lipaNaMpesaOnline({
        BusinessShortCode: 174379,
        Amount: 1,
        PartyA: `254${phone}`,
        PhoneNumber: `254${phone}`,
        PartyB: 174379,
        CallBackURL: "https://sarah-app.herokuapp.com/mpesa/callback",
        AccountReference: "Auto Repair by Sarah",
        passKey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
        TransactionType: "CustomerPayBillOnline",
      });
    } catch (error) {
      console.log(error);
      io.emit("payment", "failed");

      throw new Error(error);
    }

    res.status(200).json({
      success: true,
      message: "Payment successful",
    });

    io.emit("payment-initiated", "success");
  })
);

app.post("/mpesa/callback", (req, res) => {
  const { Body } = req.body;
  console.log(Body);

  if (Body.stkCallback.ResultCode === 0) {
    io.emit("payment-success", "success");
  } else {
    io.emit("payment-failed", "failed");
  }

  res.status(200).send("success");
});

app.use((err, req, res) => {
  res.status(500).json({
    success: false,
    message: err.message,
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
