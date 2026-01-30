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

// netlify/functions/personnel-login.js
var personnel_login_exports = {};
__export(personnel_login_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(personnel_login_exports);
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
    const { personnelId, password } = JSON.parse(event.body);
    const mockPersonnel = [
      { id: "1", password: "123456", name: "Ahmet Y\u0131lmaz" },
      { id: "2", password: "123456", name: "Ay\u015Fe Demir" },
      { id: "3", password: "123456", name: "Mehmet Kaya" },
      { id: "4", password: "123456", name: "Fatma \xD6z" }
    ];
    const personnel = mockPersonnel.find((p) => p.id === personnelId && p.password === password);
    if (personnel) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          personnel: {
            id: personnel.id,
            name: personnel.name
          },
          token: "personnel-token-" + Date.now()
        })
      };
    }
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Invalid personnel ID or password"
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
//# sourceMappingURL=personnel-login.js.map
