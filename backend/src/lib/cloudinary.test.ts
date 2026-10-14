import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "postgresql://x:x@localhost:5432/x";

test("signing matches the example in Cloudinary's documentation", async () => {
  const { sign } = await import("./cloudinary");
  const signature = sign({ timestamp: 1315060510, public_id: "sample_image", eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" }, "abcd");
  assert.equal(signature, "bfd09f95f331f558cbd1320e67aa8d488770583e");
});
