import { PaymentRequest } from "../models/PaymentRequest.js";

export async function createPaymentRequest(req, res, next) {
  try {
    if (!req.auth.user)
      return res.status(401).json({ message: "Authentication required" });

    const amount = Number(req.body.amount || 0);
    const transactionRef = String(req.body.transactionRef || "").trim();
    if (!amount || !transactionRef) {
      return res
        .status(400)
        .json({ message: "amount and transactionRef are required" });
    }

    const request = await PaymentRequest.create({
      userId: req.auth.user._id,
      amount,
      transactionRef,
      status: "pending",
    });

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
}

export async function listPaymentRequests(req, res, next) {
  try {
    const rows = await PaymentRequest.find()
      .sort({ createdAt: -1 })
      .populate("userId", "email role")
      .lean();
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function updatePaymentStatus(req, res, next) {
  try {
    const status = String(req.body.status || "");
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await PaymentRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!updated)
      return res.status(404).json({ message: "Payment request not found" });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}
