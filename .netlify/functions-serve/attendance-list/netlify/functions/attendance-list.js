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

// netlify/functions/attendance-list.js
var attendance_list_exports = {};
__export(attendance_list_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(attendance_list_exports);
async function handler(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  try {
    const params = event.queryStringParameters || {};
    const { date, location, personnelId, limit = 100 } = params;
    const mockAttendances = [
      {
        id: "1",
        personnelId: "1",
        personnelName: "Ahmet Y\u0131lmaz",
        date: "2024-01-15",
        checkIn: "2024-01-15T09:00:00",
        checkOut: "2024-01-15T18:00:00",
        hours: 9,
        location: "cengelkoy"
      },
      {
        id: "2",
        personnelId: "2",
        personnelName: "Ay\u015Fe Demir",
        date: "2024-01-15",
        checkIn: "2024-01-15T08:30:00",
        checkOut: "2024-01-15T17:30:00",
        hours: 9,
        location: "cengelkoy"
      },
      {
        id: "3",
        personnelId: "3",
        personnelName: "Mehmet Kaya",
        date: "2024-01-15",
        checkIn: "2024-01-15T10:00:00",
        checkOut: "2024-01-15T19:00:00",
        hours: 9,
        location: "kadikoy"
      },
      {
        id: "4",
        personnelId: "4",
        personnelName: "Fatma \xD6z",
        date: "2024-01-15",
        checkIn: "2024-01-15T09:15:00",
        checkOut: null,
        hours: 0,
        location: "besiktas"
      }
    ];
    let filtered = mockAttendances;
    if (date) {
      filtered = filtered.filter((a) => a.date === date);
    }
    if (location) {
      filtered = filtered.filter((a) => a.location === location);
    }
    if (personnelId) {
      filtered = filtered.filter((a) => a.personnelId === personnelId);
    }
    filtered = filtered.slice(0, parseInt(limit));
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        attendances: filtered,
        total: filtered.length
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
//# sourceMappingURL=attendance-list.js.map
