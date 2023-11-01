<script setup lang="ts">
import mapboxgl from "mapbox-gl";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useToastStore } from "../../stores/toast";
import { fetchy } from "../../utils/fetchy";
import CreatePostForm from "../Post/CreatePostForm.vue";
import PostComponent from "../Post/PostComponent.vue";
mapboxgl.accessToken = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";
const MAPBOX_TOKEN = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";

const props = defineProps(["trails", "mapRef"]);

// TODO: compute center and bounding box to capture ALL points -- set it in mount?
let { lng, lat, bearing, pitch, zoom } = { lng: -158.124, lat: 21.431, bearing: 0, pitch: 60, zoom: 12 };

let map;
let selectedTrailId = ref();
let selectedPostId = ref();
let showCard = ref(false);

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
    map.resize();
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
    zoom: 13,
    essential: true, // this animation is considered essential with respect to prefers-reduced-motion
  });
}

function flyToPoint(lng, lat) {
  const alteredLng = lng > 0 ? lng - 0.005 : lng + 0.005;
  map.flyTo({
    center: [alteredLng, lat],
    zoom: 15,
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
      selectedTrailId.value = trail._id;
      selectedPostId.value = loc.post;
      showCard.value = true;
      flyToPoint(loc.lng, loc.lat);
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

let post = ref();
let trail = ref();

watch(selectedTrailId, async (newId, oldId) => {
  trail.value = props.trails.find((t) => t._id === newId);
});

watch(selectedPostId, async (newId, oldId) => {
  if (newId) {
    const postResponse = await fetchy(`/api/posts/`, "GET", { query: { id: newId.toString() } });
    post.value = postResponse.post;
  } else {
    post.value = undefined;
  }
});

function getCoordinates(trail) {
  console.log("trail ", trail, selectedPostId.value);
  const coords = trail.locations.find((loc) => {
    return loc.post === selectedPostId.value;
  });

  console.log("coords ", coords);

  return `(${coords.lng}, ${coords.lat})`;
}

function closeForm() {
  showCard.value = false;
}

/** functions for getting post from selected point */
</script>

<template>
  <div :id="props.mapRef" class="mapContainer"></div>
  <v-sheet v-if="showCard" rounded class="post-sheet">
    <div v-if="trail">
      <div class="row">
        <h3>{{ trail.name }}</h3>
        <v-icon @click="closeForm">mdi-close</v-icon>
      </div>

      <!-- TODO: clicking on author takes them to their profile -->

      <!-- <h4>{{ trail.author }}</h4> -->
      <h6>{{ trail.distance }} miles</h6>
      <h6>{{ trail.duration }} hours</h6>
      <h6>{{ getCoordinates(trail) }}</h6>
    </div>
    <PostComponent v-if="post" :post="post" />
    <div v-else class="gap">
      <CreatePostForm />
      <div class="center background">No post found for this location!</div>
    </div>
  </v-sheet>
</template>
this.map.resize();
<style scoped>
.center {
  align-items: center;
  justify-content: center;
}
.background {
  background-color: #95b08d24;
  border-radius: 1em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em;
}
.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: start;
}
.mapContainer {
  height: 100%;
}

.gap {
  display: flex;
  flex-direction: column;
  gap: 1em;
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

.post-sheet {
  display: flex;
  flex-direction: column;
  row-gap: 1.5em;
  position: absolute;
  top: 2em;
  right: 2em;
  padding: 1em;
  width: 40%;
  height: calc(100% - 4em);
  overflow-y: scroll;
  background-color: #ffffffe9;
}
</style>
