/** @notice Library imports */
import cors from "cors";
import express from "express";
/// Local imports ///
import { RouterPaths, orderRouter } from "@/routers";

const app = express();

/// Global middlewares ///
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/// Routes ///
app.use(RouterPaths.ORDERS, orderRouter);

/// Error handler ///

export default app;
