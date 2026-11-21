import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { PublicVehicleCard } from "@/lib/showbizz/content";

function availabilityLabel(value: PublicVehicleCard["availability"]): string {
  if (value === "available") return "Available";
  if (value === "on_request") return "On request";
  return "Currently unavailable";
}

export function FeaturedVehicleShowcase({ vehicles }: { vehicles: PublicVehicleCard[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = vehicles.length;
  const activeVehicle = count ? vehicles[activeIndex % count] : null;

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % count);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  const move = (direction: -1 | 1) => {
    if (!count) return;
    setActiveIndex((current) => (current + direction + count) % count);
  };

  return (
    <section
      className="home-showcase"
      aria-label="Featured vehicles"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="home-showcase__topline">
        <span>Showbizz / The collection</span>
        <span>{count ? `0${activeIndex + 1} / 0${count}` : "Curated fleet"}</span>
      </div>

      {activeVehicle ? (
        <>
          <div className="home-showcase__media">
            {activeVehicle.imageUrl ? (
              <img
                key={activeVehicle.slug}
                src={activeVehicle.imageUrl}
                alt={activeVehicle.title}
                className="home-showcase__image"
                fetchPriority="high"
              />
            ) : (
              <div className="home-showcase__placeholder" role="img" aria-label={`${activeVehicle.title} photograph coming soon`}>
                <span className="home-showcase__placeholder-mark">SHOWBIZZ <strong>CARS</strong></span>
                <span className="home-showcase__placeholder-line" />
                <span className="home-showcase__placeholder-title">{activeVehicle.title}</span>
                <span className="home-showcase__placeholder-note">Vehicle photography being prepared</span>
              </div>
            )}
            <div className="home-showcase__shade" />
            <div className="home-showcase__caption">
              <div className="home-showcase__meta">
                <span className={`home-showcase__availability home-showcase__availability--${activeVehicle.availability}`}>
                  <span aria-hidden="true" />{availabilityLabel(activeVehicle.availability)}
                </span>
                {activeVehicle.category ? <span>{activeVehicle.category}</span> : null}
              </div>
              <h2>{activeVehicle.title}</h2>
              {activeVehicle.summary ? <p>{activeVehicle.summary}</p> : null}
              <div className="home-showcase__bottom">
                <span>{activeVehicle.dailyRateLabel ? `${activeVehicle.dailyRateLabel} / day` : "Pricing on enquiry"}</span>
                <Link to="/vehicles/$slug" params={{ slug: activeVehicle.slug }}>
                  Discover vehicle <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="home-showcase__controls">
            <div className="home-showcase__dots" aria-label="Choose featured vehicle">
              {vehicles.map((vehicle, index) => (
                <button
                  key={vehicle.slug}
                  type="button"
                  aria-label={`Show ${vehicle.title}`}
                  aria-pressed={index === activeIndex}
                  className={index === activeIndex ? "is-active" : ""}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
            {count > 1 ? (
              <div className="home-showcase__arrows">
                <button type="button" onClick={() => move(-1)} aria-label="Previous featured vehicle">←</button>
                <button type="button" onClick={() => move(1)} aria-label="Next featured vehicle">→</button>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="home-showcase__empty">
          <div className="home-showcase__empty-orbit" aria-hidden="true" />
          <span className="home-showcase__placeholder-mark">SHOWBIZZ <strong>CARS</strong></span>
          <p className="eyebrow">The next drive awaits</p>
          <h2>Our collection is being curated.</h2>
          <p>Featured vehicles will appear here as the team publishes them.</p>
          <Link to="/vehicles" className="home-showcase__empty-link">Explore the collection ↗</Link>
        </div>
      )}
    </section>
  );
}
