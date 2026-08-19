import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createSvgIcon = (color) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36" height="36">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const truckIcon = createSvgIcon('#ec4899');
const deliveryIcon = createSvgIcon('#2563eb');
const pickupIcon = createSvgIcon('#16a34a');

const DeliveryMap = ({ pickup, delivery, currentLocation, routePoints = [] }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const propsRef = useRef({ pickup, delivery, currentLocation, routePoints });

  useEffect(() => {
    propsRef.current = { pickup, delivery, currentLocation, routePoints };
  }, [pickup, delivery, currentLocation, routePoints]);

  const getValidCoords = useCallback((loc) => {
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return null;
    return [loc.lat, loc.lng];
  }, []);

  const getCenter = useCallback(() => {
    const { currentLocation: c, pickup: p, delivery: d } = propsRef.current;
    if (c) {
      const coords = getValidCoords(c);
      if (coords) return coords;
    }
    if (p) {
      const coords = getValidCoords(p);
      if (coords) return coords;
    }
    if (d) {
      const coords = getValidCoords(d);
      if (coords) return coords;
    }
    return [27.7172, 85.324];
  }, [getValidCoords]);

  // Initialize map once. We use propsRef to access latest props without
  // re-creating the map on every prop change.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasValid = pickup || delivery || currentLocation;
    if (!hasValid) return;

    const tryInit = () => {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) {
        setTimeout(tryInit, 150);
        return;
      }

      const center = getCenter();
      const map = L.map(containerRef.current, {
        center,
        zoom: 15,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapRef.current = map;
      markersRef.current = [];
      polylineRef.current = null;

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    };

    tryInit();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pickup, delivery, currentLocation, getCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const { pickup: p, delivery: d, currentLocation: c, routePoints: r } = propsRef.current;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
      const marker = L.marker([p.lat, p.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<strong>Pickup Location</strong><br/>${p.address || ''}`);
      markersRef.current.push(marker);
    }

    if (d && Number.isFinite(d.lat) && Number.isFinite(d.lng)) {
      const marker = L.marker([d.lat, d.lng], { icon: deliveryIcon })
        .addTo(map)
        .bindPopup(`<strong>Delivery Location</strong><br/>${d.address || ''}`);
      markersRef.current.push(marker);
    }

    if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
      const marker = L.marker([c.lat, c.lng], { icon: truckIcon })
        .addTo(map)
        .bindPopup(`<strong>Current Location</strong><br/>Last updated: ${new Date(c.updatedAt).toLocaleTimeString()}`);
      markersRef.current.push(marker);
    }

    const validRoute = (r || []).filter((pt) => Number.isFinite(pt.lat) && Number.isFinite(pt.lng));
    if (validRoute.length > 1) {
      polylineRef.current = L.polyline(validRoute.map((pt) => [pt.lat, pt.lng]), {
        color: '#ec4899',
        weight: 4,
        opacity: 0.7,
      }).addTo(map);
    }

    const center = getCenter();
    const current = map.getCenter();
    if (Math.abs(current.lat - center[0]) > 0.0001 || Math.abs(current.lng - center[1]) > 0.0001) {
      map.setView(center, 15);
    }
  }, [pickup, delivery, currentLocation, routePoints, getCenter]);

  const hasAnyLocation = getValidCoords(pickup) || getValidCoords(delivery) || getValidCoords(currentLocation);

  if (!hasAnyLocation) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        No location data available
      </div>
    );
  }

  return <div ref={containerRef} className="h-[400px] w-full rounded-xl bg-gray-100" />;
};

export default DeliveryMap;
