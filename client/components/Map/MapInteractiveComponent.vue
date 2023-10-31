<script setup lang="ts">
import mapboxgl from "mapbox-gl";
import { onMounted, onUnmounted } from "vue";
import { useToastStore } from "../../stores/toast";
mapboxgl.accessToken = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";

const props = defineProps(["trails", "mapRef", "trailValue", "postValue"]);
const emit = defineEmits(["updateTrailValue", "updatePostValue"]);

// TODO: compute center and bounding box to capture ALL points -- set it in mount?
let { lng, lat, bearing, pitch, zoom } = { lng: -158.124, lat: 21.431, bearing: 0, pitch: 60, zoom: 12 };

let map;

// watch(
//   props.postValue.value,
//   (newPost, oldPost) => {
//     console.log("IN WATCH");
//     if (!newPost) {
//       // zoom out
//     } else {
//       // find post in trail
//       const loc = props.trails.find((trail) => {
//         trail._id === props.trailValue;
//       });

//       flyTo({ lat: loc.lat, lng: loc.lng });
//     }
//   },
//   { immediate: true },
// );

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

onUnmounted(() => {
  map.remove();
  map = null;
});

/** helper functions */

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

/** mapping functions */

function mapMarkers(trail) {
  for (const [index, loc] of trail.locations.entries()) {
    let el = document.createElement("div");
    el.className = "marker";
    el.id = `marker-${trail._id}-${loc.post}`;
    el.onclick = () => {
      emit("updateTrailValue", trail._id);
      emit("updatePostValue", index);
    };
    //     el.innerHTML = `
    //     <span class="marker-label">${index + 1}</span>
    //   `;
    const marker = new mapboxgl.Marker({
      element: el,
    })
      .setLngLat({ lng: loc.lng, lat: loc.lat })
      .addTo(map);
  }
}

function mapRoute(trail, route) {
  const geojson = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: route,
    },
  };

  const layerId = `trail-${trail._id}`;
  map.addLayer({
    id: layerId,
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

  //   map.on("click", layerId, (e) => {
  //     emit("updateTrailValue", trail._id);
  //     emit("updatePostValue", -1);
  //   });
}

async function mapTrail(trail) {
  let points;

  // if trail has no points
  if (trail.locations.length === 0) {
    return;
  }
  // if trail has 1 point
  if (trail.locations.length < 2) {
    mapMarkers(trail);
  } else {
    mapMarkers(trail);
    const directions = await getDirections(trail);
    const routes = directions.routes;
    mapRoute(trail, routes[0].geometry.coordinates);
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
