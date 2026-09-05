import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "http://localhost:3000";
const shortCode = __ENV.SHORT_CODE;

export const options = {
  scenarios: {
    redirects: {
      executor: "constant-arrival-rate",
      rate: Number(__ENV.RATE || 50),
      timeUnit: "1s",
      duration: __ENV.DURATION || "30s",
      preAllocatedVUs: Number(__ENV.VUS || 10),
      maxVUs: Number(__ENV.MAX_VUS || 100),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<250", "p(99)<500"],
  },
};

export default function () {
  if (!shortCode) {
    throw new Error("SHORT_CODE is required");
  }

  const response = http.get(`${baseUrl}/${shortCode}`, {
    redirects: 0,
    tags: { scenario: "redirect" },
  });

  check(response, {
    "redirect returned 302": (result) => result.status === 302,
    "location header exists": (result) => Boolean(result.headers.Location),
  });

  sleep(0.01);
}