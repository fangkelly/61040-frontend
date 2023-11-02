<script setup lang="ts">
import mapboxgl from "mapbox-gl";
import { onMounted, onUnmounted, onUpdated, ref, watch } from "vue";
import { useToastStore } from "../../stores/toast";
import { fetchy } from "../../utils/fetchy";
import CreatePostForm from "../Post/CreatePostForm.vue";
import PostComponent from "../Post/PostComponent.vue";
mapboxgl.accessToken = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";
const MAPBOX_TOKEN = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";

const props = defineProps(["trails", "mapRef"]);
const emit = defineEmits(["updateTrailWithPost", "updateTrailWithoutPost"]);
const loading = ref(false);

// TODO: compute center and bounding box to capture ALL points -- set it in mount?
let { lng, lat, bearing, pitch, zoom } = { lng: -158.124, lat: 21.431, bearing: 0, pitch: 60, zoom: 12 };

let map;
let selectedTrailId = ref();
let selectedPostId = ref();
let showCard = ref(false);

let selected = ref({ trailId: null, postIndex: null });
let post = ref();
let trail = ref();

async function getPost(postId) {
  loading.value = true;
  if (postId) {
    console.log("postId ", postId);
    const postResponse = await fetchy(`/api/posts/`, "GET", { query: { id: postId } });

    post.value = postResponse.post;
    console.log("post.value ", post.value);
  } else {
    post.value = undefined;
  }

  loading.value = false;
}

watch(selected, async (newSelected, oldSelected) => {
  const trailId = newSelected.trailId;
  const postIndex = newSelected.postIndex;

  const selectedTrail = props.trails.find((t) => t._id === trailId);
  trail.value = selectedTrail;

  console.log("postindex ", postIndex);
  console.log(selectedTrail.locations[postIndex]);

  const postId = selectedTrail.locations[postIndex].post;
  await getPost(postId);

  loading.value = false;
});

onUpdated(() => {
  console.log("tonUPDATED trails ", props.trails);
});

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

function fitToBbox(points) {
  var coordinates = points;

  var bounds = coordinates.reduce(
    function (bounds, coord) {
      return bounds.extend(coord);
    },
    new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
  );

  map.fitBounds(bounds, {
    padding: { top: 50, bottom: 50, left: 50, right: 50 },
    easing(t) {
      return t * (2 - t);
    },
  });
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
      showCard.value = true;
      loading.value = true;
      selected.value = {
        trailId: trail._id,
        postIndex: index,
      };
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
}

async function mapTrail(trail) {
  console.log("mapping trail ", trail);
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

function getCoordinates(trail) {
  console.log("trail ", trail);
  const locations = trail.locations;
  const loc = locations[selected.value.postIndex];

  return `(${loc.lng}, ${loc.lat})`;
}

function closeForm() {
  showCard.value = false;
}

async function handleDeletePost(postId) {
  try {
    await fetchy(`/api/posts/${postId}`, "DELETE");
  } catch {
    return;
  }

  post.value = undefined;

  emit("updaTrailWithoutPost", trail.value._id, selected.value.postIndex);
}

async function handleCreatePost(content, media) {
  const res = await fetchy(`/api/posts`, "POST", { body: { content, media } });

  console.log("+++++++++++++++++++++++++++++++");

  // get post id to associate with trail
  const postId = res.post._id;

  console.log("postId: ", postId);

  // get copy of the trail's list of locations
  const newLocations = trail.value.locations;
  console.log("newLocation:s ", newLocations);

  // get location entry
  let selectedLocation = newLocations[selected.value.postIndex];
  console.log(selected.value.postIndex);
  console.log("selectedLocation: ", selectedLocation);

  // create new location object with postId added
  let newLocation = { ...selectedLocation, post: postId };
  console.log("newLocation ", newLocation);

  // substitue it into the list of locations
  newLocations[selected.value.postIndex] = newLocation;
  console.log("newLocations ", newLocations);

  // update the trail with its new locations
  await fetchy(`/api/trails/${trail.value._id}`, "PATCH", { body: { locations: newLocations } });

  // emit to parent to update list of trails
  selectedPostId.value = postId;
  emit("updateTrailWithPost", trail.value._id, selected.value.postIndex, newLocations);

  await getPost(postId);
}
</script>

<template>
  <div :id="props.mapRef" class="mapContainer"></div>
  <div v-if="!loading">
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
        <h6 v-if="post && selectedPostId">{{ getCoordinates(trail) }}</h6>
      </div>

      <PostComponent v-if="post" :post="post" @handleDeletePost="handleDeletePost" />
      <div v-else class="gap">
        <CreatePostForm @handleCreatePost="handleCreatePost" />
        <div class="center background">No post found for this location!</div>
      </div>
    </v-sheet>
  </div>
  <div v-else>
    <v-sheet class="load-sheet post-sheet"> <v-progress-circular indeterminate color="#95b08d"></v-progress-circular> </v-sheet>
  </div>
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

.load-sheet.post-sheet {
  justify-content: center;
  align-items: center;
}
</style>
