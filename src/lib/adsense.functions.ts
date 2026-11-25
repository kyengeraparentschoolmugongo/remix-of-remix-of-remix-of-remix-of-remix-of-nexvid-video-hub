import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { isProductionAdDomain } from "./adsense";

export const getAdSenseConfig = createServerFn({ method: "GET" }).handler(() => {
  const req = getRequest();
  const url = new URL(req.url);
  const rawHost =
    url.hostname === "localhost"
      ? (req.headers.get("x-forwarded-host") ?? url.hostname)
      : url.hostname;
  const hostname = (rawHost.split(",")[0] ?? "").trim();
  return { enabled: isProductionAdDomain(hostname) };
});