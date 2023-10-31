<script setup lang="ts">
import { useToastStore } from "@/stores/toast";
import * as turf from "@turf/turf";
import mapboxgl from "mapbox-gl";
import { onMounted, onUnmounted, onUpdated, ref } from "vue";
mapboxgl.accessToken = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";

// trails is list of objects with author, name, description, location (lat,lng, post), pinned, distance,
const props = defineProps(["trails", "draggable", "mapRef"]);

const emit = defineEmits(["updateDistanceTime", "updateMarkerLocation", "updateCorrectedTrail"]);

// list of id references for markers
let currentMarkers = ref([]);

let map;
let { lng, lat, bearing, pitch, zoom } = { lng: -158.124, lat: 21.431, bearing: 0, pitch: 60, zoom: 12 };

onMounted(() => {
  map = new mapboxgl.Map({
    container: props.mapRef,
    style: "mapbox://styles/fangk/cln4vt2gg06w901qrgym22cdp",
    center: [lng, lat],
    bearing,
    pitch,
    zoom,
  });

  map.on("style.load", () => {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    // add the DEM source as a terrain layer with exaggerated height
    map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

    map.addLayer({
      id: "countour-labels",
      type: "symbol",
      source: {
        type: "vector",
        url: "mapbox://mapbox.mapbox-terrain-v2",
      },
      "source-layer": "contour",
      layout: {
        visibility: "visible",
        "symbol-placement": "line",
        "text-field": ["concat", ["to-string", ["get", "ele"]], "m"],
      },
      paint: {
        "icon-color": "#877b59",
        "icon-halo-width": 1,
        "text-color": "#877b59",
        "text-halo-width": 1,
      },
    });

    map.addLayer({
      id: "countours",
      type: "line",
      source: {
        type: "vector",
        url: "mapbox://mapbox.mapbox-terrain-v2",
      },
      "source-layer": "contour",
      layout: {
        visibility: "visible",
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#877b59",
        "line-width": 0.25,
      },
    });
  });

  map.on("load", async function () {
    const trailPromises = props.trails.map(async (trail) => {
      return await mapTrail(trail);
    });

    await Promise.all(trailPromises);
  });
});

async function getDirections(trail) {
  const coordinates = trail.locations.map((point) => `${point.lng},${point.lat}`);
  const stringCoordinates = coordinates.join(";");
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${stringCoordinates}?alternatives=true&annotations=distance%2Cduration&geometries=geojson&language=en&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  const resJSON = await res.json();
  if (res.ok) {
    return resJSON;
  } else {
    useToastStore().showToast({ message: resJSON.message, style: res.ok ? "success" : "error" });
  }
}

function mapMarkers(locations) {
  for (const [index, loc] of locations.entries()) {
    let el = document.createElement("div");
    el.className = "marker";
    el.id = `marker-${index}`;
    el.innerHTML = `
    <span class="marker-label">${index + 1}</span>
  `;
    const marker = new mapboxgl.Marker({
      element: el,
      draggable: true,
    })

      .setLngLat(loc)
      .addTo(map);

    function onDragEnd() {
      const lngLat = marker.getLngLat();
      emit("updateMarkerLocation", { index: index, lng: lngLat.lng, lat: lngLat.lat });
    }

    marker.on("dragend", onDragEnd);

    currentMarkers.value = [...currentMarkers.value, marker];
  }
}

function clearAllMarkers() {
  if (currentMarkers.value !== null) {
    for (let i = 0; i < currentMarkers.value.length; i++) {
      const marker = currentMarkers.value[i];
      marker.remove();
    }
  }
  currentMarkers.value = [];
}

function mapRoute(route) {
  const geojson = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: route,
    },
  };

  if (map.getSource("route")) {
    map.getSource("route").setData(geojson);
  } else {
    map.addLayer({
      id: "route",
      type: "line",
      source: {
        type: "geojson",
        data: geojson,
      },
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#FF8888",
        "line-width": 5,
        "line-opacity": 0.75,
      },
    });
  }
}

async function mapTrail(trail) {
  const center = map.getCenter();

  if (!trail) {
    clearAllMarkers();
    clearMap();
  }

  // map empty locations of trails to current center of map so that user can move the markers
  const sanitizedTrail = {
    locations: trail.locations.map((loc) => {
      if (!loc.lng || !loc.lat) {
        return { lat: center.lat, lng: center.lng };
      }
      return loc;
    }),
  };

  let points;

  // if trail has no points

  if (sanitizedTrail.locations.length === 0) {
    emit("updateDistanceTime", { distance: 0, duration: 0 });
    clearMap();
    return;
  }

  // if trail has 1 point
  if (sanitizedTrail.locations.length < 2) {
    emit("updateDistanceTime", { distance: 0, duration: 0 });

    if (map.getLayer("route")) {
      map.removeLayer("route");
      map.removeSource("route");
    }

    const locations = sanitizedTrail.locations;
    const center = [locations[0].lng, locations[0].lat];
    points = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: center,
          },
        },
      ],
    };

    emit("updateCorrectedTrail", trail.locations);

    if (props.draggable) {
      clearAllMarkers();
      mapMarkers(locations);
    }
    mapPoints(points);
    flyTo(center);
  } else {
    const directions = await getDirections(sanitizedTrail);
    const routes = directions.routes;
    emit("updateDistanceTime", { distance: Math.round(routes[0].distance * 0.000621371 * 100) / 100, duration: Math.round(routes[0].duration * 0.000277778 * 100) / 100 });
    mapRoute(routes[0].geometry.coordinates);
    const waypoints = {
      type: "FeatureCollection",
      features: directions.waypoints.map((point) => {
        return {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: point.location,
          },
        };
      }),
    };
    points = waypoints;

    if (props.draggable) {
      clearAllMarkers();
      mapMarkers(
        directions.waypoints.map((waypoint) => {
          return waypoint.location;
        }),
      );
    }
    const correctedTrail = directions.waypoints.map((w) => {
      const loc = w.location;
      return { lat: loc[1], lng: loc[0] };
    });

    emit("updateCorrectedTrail", correctedTrail);

    mapPoints(points);
    fitToBbox(points);
  }
}

onUpdated(async () => {
  if (props.trails) {
    const trailPromises = props.trails.map(async (trail) => {
      return await mapTrail(trail);
    });

    await Promise.all(trailPromises);
  } else {
    clearMap();
  }
});

onUnmounted(() => {
  map.remove();
  map = null;
});

function flyTo(center) {
  map.flyTo({
    center: center,
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
}

function fitToBbox(geoObject) {
  var bounds = turf.bbox(geoObject);
  map.fitBounds([
    [bounds[0], bounds[1]], // southwestern corner of the bounds
    [bounds[2], bounds[3]], // northeastern corner of the bounds
  ]);
}

function mapPoints(points) {
  if (map.getLayer("waypoints")) {
    map.getSource("waypoints").setData(points);
  } else {
    map.addLayer({
      id: "waypoints",
      type: "circle",
      source: {
        type: "geojson",
        data: points,
      },
      paint: {
        "circle-radius": 10,
        "circle-color": "#E46363",
      },
    });
  }
}

function clearMap() {
  if (map.getLayer("waypoints")) {
    map.removeLayer("waypoints");
    map.removeSource("waypoints");
  }

  if (map.getLayer("route")) {
    map.removeLayer("route");
    map.removeSource("route");
  }
}
</script>

<template>
  <div :id="props.mapRef" class="map-container"></div>
</template>

<style>
.map-container {
  height: 100%;
  position: absolute;
}

.marker {
  border-radius: 50%;
  height: 20px;
  width: 20px;
  background-color: #e46363;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
}
</style>
