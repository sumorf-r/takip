var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/attendance-check.js
var attendance_check_exports = {};
__export(attendance_check_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(attendance_check_exports);
async function handler(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  try {
    const { qrCode, personnelId, action } = JSON.parse(event.body);
    const attendance = {
      id: Math.random().toString(36).substr(2, 9),
      personnelId,
      action,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      location: qrCode.split("-")[0],
      // Extract location from QR code
      success: true
    };
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        attendance,
        message: `${action === "check-in" ? "Giri\u015F" : "\xC7\u0131k\u0131\u015F"} ba\u015Far\u0131yla kaydedildi`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Internal server error"
      })
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=attendance-check.js.map
