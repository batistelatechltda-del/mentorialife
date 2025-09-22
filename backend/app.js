const express = require('express')
const app = express()
const cors = require("cors");
const { reqLogger } = require("./configs/logger");
const errorHandler = require("./middlewares/errorHandler.middleware");

// done
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);


app.use(
  express.json({
    limit: "50mb",
    extended: true,
    parameterLimit: 5000,
  })
);

app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 5000,
  })
);

app.use(reqLogger);

app.use("/api/auth", require("./routes/auth/auth.routes"));
app.use("/api/client", require("./routes/client"));
app.use(errorHandler);



module.exports = app;
