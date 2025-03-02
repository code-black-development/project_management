import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/jobtitles", () => {
    console.log('Captured a "POST /posts" request');
    return HttpResponse.json({ id: 1, title: "refreshed job" });
  }),
];
