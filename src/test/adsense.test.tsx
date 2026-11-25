import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdSenseBanner } from "@/components/AdSenseBanner";
import {
  ADSENSE_PUBLISHER_ID,
  ADSENSE_SCRIPT_URL,
  ADSENSE_SLOTS,
  isProductionAdDomain,
} from "@/lib/adsense";

afterEach(() => {
  delete window.adsbygoogle;
  document
    .querySelectorAll(`script[src^="${ADSENSE_SCRIPT_URL}"]`)
    .forEach((node) => node.remove());
});

describe("isProductionAdDomain", () => {
  it("blocks localhost, loopback, and preview domains", () => {
    expect(isProductionAdDomain("localhost")).toBe(false);
    expect(isProductionAdDomain("localhost:8080")).toBe(false);
    expect(isProductionAdDomain("127.0.0.1")).toBe(false);
    expect(isProductionAdDomain("id-preview--e2ab6c84-3ebd-40ce-8a62-058403d2e2b4.lovable.app")).toBe(
      false,
    );
    expect(isProductionAdDomain("preview--freshflix.lovable.app")).toBe(false);
    expect(isProductionAdDomain("demo.lovableproject.com")).toBe(false);
  });

  it("allows live production domains", () => {
    expect(isProductionAdDomain("freshflix.ug")).toBe(true);
    expect(isProductionAdDomain("www.freshflix.com")).toBe(true);
    expect(isProductionAdDomain("freshflix.lovable.app")).toBe(true);
  });
});

describe("AdSenseBanner", () => {
  it("does not request ads or push to adsbygoogle on localhost or preview domains", () => {
    const push = vi.fn();
    window.adsbygoogle = { push } as unknown as unknown[];

    const { container } = render(
      <AdSenseBanner
        slot="primaryContent"
        hostname="id-preview--e2ab6c84-3ebd-40ce-8a62-058403d2e2b4.lovable.app"
      />,
    );

    expect(screen.getByText("Advertisement")).toBeInTheDocument();
    expect(container.querySelector("ins.adsbygoogle")).toBeNull();
    expect(document.querySelector(`script[src^="${ADSENSE_SCRIPT_URL}"]`)).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("loads script once, renders responsive attributes, and guards against duplicate pushes on live domains", () => {
    const push = vi.fn();
    window.adsbygoogle = { push } as unknown as unknown[];

    const { container, rerender } = render(
      <AdSenseBanner slot="primaryContent" hostname="freshflix.ug" />,
    );

    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).not.toBeNull();
    expect(ins).toHaveAttribute("data-ad-client", ADSENSE_PUBLISHER_ID);
    expect(ins).toHaveAttribute("data-ad-slot", ADSENSE_SLOTS.primaryContent);
    expect(ins).toHaveAttribute("data-ad-format", "auto");
    expect(ins).toHaveAttribute("data-full-width-responsive", "true");

    const scripts = document.querySelectorAll(`script[src="${ADSENSE_SCRIPT_URL}"]`);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toHaveAttribute("crossorigin", "anonymous");
    expect(push).toHaveBeenCalledTimes(1);

    // Re-rendering the same mounted banner must not push a second time
    rerender(<AdSenseBanner slot="primaryContent" hostname="freshflix.ug" className="extra" />);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("supports the catalog listing slot ID", () => {
    const { container } = render(<AdSenseBanner slot="catalogListing" hostname="freshflix.ug" />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).toHaveAttribute("data-ad-slot", "6708057658");
  });
});