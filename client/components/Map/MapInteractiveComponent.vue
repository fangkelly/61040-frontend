<script setup lang="ts">
// @ts-nocheck
import { useUserStore } from "@/stores/user";
import mapboxgl from "mapbox-gl";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useFriendStore } from "../../stores/friend";
import { useToastStore } from "../../stores/toast";
import { fetchy } from "../../utils/fetchy";
import CreatePostForm from "../Post/CreatePostForm.vue";
import PostComponent from "../Post/PostComponent.vue";
mapboxgl.accessToken = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";
const MAPBOX_TOKEN = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";
const { currentUsername } = storeToRefs(useUserStore());
const { friends } = storeToRefs(useFriendStore());

const props = defineProps(["trails", "mapRef"]);
const emit = defineEmits(["refreshTrails"]);
const loading = ref(false);
const currentMarkers = ref({});
const currentTrails = ref([]);

const COLOR_MAP = {
  mine: "#e36363",
  friend: "#e4a363",
  other: "#ce8aff",
};

let { lng, lat, bearing, pitch, zoom } = { lng: -98.5795, lat: 39.8283, bearing: 0, pitch: 45, zoom: 4 };

let map;
let selectedPostId = ref();
let showCard = ref(false);

let selected = ref({ trailId: null, postIndex: null });
let post = ref();
let trail = ref();

async function getPost(postId) {
  loading.value = true;
  if (postId) {
    const postResponse = await fetchy(`/api/posts/`, "GET", { query: { id: postId } });

    post.value = postResponse.post;
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

  const postId = selectedTrail.locations[postIndex].post;
  await getPost(postId);

  loading.value = false;
});

onMounted(() => {
  map = new mapboxgl.Map({
    container: props.mapRef,
    style: "mapbox://styles/fangk/cln4vt2gg06w901qrgym22cdp",
    center: [lng, lat],
    projection: "globe",
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
    await getTrails();
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

function clearAllMarkers(trailId?: string) {
  if (!trailId) {
    for (const [t, markers] of Object.entries(currentMarkers.value)) {
      for (const m of markers) {
        m.remove();
      }
      currentMarkers.value[t] = [];
    }
  } else {
    const trailMarkers = currentMarkers.value[trailId];
    if (!trailMarkers) return;
    for (const marker of trailMarkers) {
      marker.remove();
    }
    currentMarkers.value[trailId] = [];
  }
}

function handleFlyTo(trailId, locIndex) {
  const trail = props.trails.find((t) => t._id === trailId);
  const loc = trail.locations[locIndex];
  flyToPoint(loc.lng, loc.lat);
}

function mapMarkers(trail) {
  let color;
  if (currentUsername.value === trail.author) {
    color = "mine";
  } else if (friends.value.includes(trail.author)) {
    color = "friend";
  } else {
    color = "other";
  }

  const draggable = trail.author === currentUsername.value;
  for (const [index, loc] of trail.locations.entries()) {
    let el = document.createElement("div");
    el.className = `marker ${color}`;

    el.id = `marker-${trail._id}-${loc.post}`;
    el.onclick = () => {
      showCard.value = true;
      loading.value = true;
      selected.value = {
        trailId: trail._id,
        postIndex: index,
      };
      handleFlyTo(trail._id, index);
    };
    //     el.innerHTML = `
    //     <span class="marker-label">${index + 1}</span>
    //   `;
    const marker = new mapboxgl.Marker({
      element: el,
      draggable: draggable,
    })
      .setLngLat({ lng: loc.lng, lat: loc.lat })
      .addTo(map);

    async function onDragEnd() {
      const lngLat = marker.getLngLat();

      // get the set of coordinates at this index of the location
      const originalLocation = trail.locations[index];

      const newLocation = { ...originalLocation, lng: lngLat.lng, lat: lngLat.lat };

      const trailLocations = trail.locations;
      trailLocations[index] = newLocation;

      const newTrail = { ...trail, locations: trailLocations };

      // get adjusted waypoints and route from mapTrail function

      if (trailLocations.length > 1) {
        const directions = await getDirections(newTrail);
        const routes = directions.routes;
        mapRoute(trail, routes[0].geometry.coordinates);
        let adjustedTrail = newTrail;
        for (let i = 0; i < directions.waypoints.length; i++) {
          let adjustedLocation = adjustedTrail.locations[i];
          adjustedLocation.lng = directions.waypoints[i].location[0];
          adjustedLocation.lat = directions.waypoints[i].location[1];
          adjustedTrail.locations[i] = adjustedLocation;
        }

        await fetchy(`/api/trails/${trail._id}`, "PATCH", { body: { locations: adjustedTrail.locations } });
        emit("refreshTrails");

        clearAllMarkers(trail._id);
        mapMarkers(adjustedTrail);
        flyTo(directions.waypoints[index].location);
      } else {
        await fetchy(`/api/trails/${trail._id}`, "PATCH", { body: { locations: trailLocations } });
        emit("refreshTrails");
        clearAllMarkers(trail._id);
        mapMarkers(newTrail);
        flyTo(trailLocations[0]);
      }
    }

    marker.on("dragend", onDragEnd);
    let trailMarkers = currentMarkers.value[`${trail._id}`];
    if (trailMarkers) {
      trailMarkers.push(marker);
    } else {
      trailMarkers = [marker];
    }

    currentMarkers.value[`${trail._id}`] = trailMarkers;
  }
}

function mapRoute(trail, route) {
  if (map.getLayer(`trail-${trail._id}`)) {
    map.removeLayer(`trail-${trail._id}`);
    map.removeSource(`trail-${trail._id}`);
  }

  let color;
  if (currentUsername.value === trail.author) {
    color = COLOR_MAP.mine;
  } else if (friends.value.includes(trail.author)) {
    color = COLOR_MAP.friend;
  } else {
    color = COLOR_MAP.other;
  }

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
      "line-color": color,
      "line-width": 5,
      "line-opacity": 0.75,
    },
  });

  currentTrails.value.push(layerId);
}

async function mapTrail(trail) {
  clearAllMarkers(trail._id);
  // if trail has no points
  if (trail.locations.length === 0) {
    return trail.locations;
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

async function getTrails() {
  loading.value = true;

  const trailPromises = props.trails.map(async (trail) => {
    return await mapTrail(trail);
  });

  await Promise.all(trailPromises);
  loading.value = false;
}

function getCoordinates(trail) {
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

  // emit("refreshTrails", trail.value._id, selected.value.postIndex);
  emit("refreshTrails");
  // await getTrails();
}

// watchEffect(async () => {
//   console.log(`detected change in trails prop`, props.trails);

//   const trailIds = props.trails.map((t) => {
//     return t._id;
//   });

//   const toDelete = currentTrails.value.filter((t) => !trailIds.includes(t));

//   for (const trailId of toDelete) {
//     if (map.getLayer(`trail-${trailId}`)) {
//       console.log("SOURCE FOR TRAIL ", trailId);
//       map.removeLayer(`trail-${trailId}`);
//       map.removeSource(`trail-${trailId}`);
//     }
//     clearAllMarkers(trailId);
//   }

//   await getTrails();
// });

watch(
  () => props.trails,
  async (newTrails, oldTrails) => {
    const trailIds = newTrails.map((t) => {
      return t._id;
    });

    const layerIds = currentTrails.value.map((t) => {
      return t.split("-")[1];
    });

    const toDelete = layerIds.filter((t) => !trailIds.includes(t));

    for (const trailId of toDelete) {
      if (map.getLayer(`trail-${trailId}`)) {
        map.removeLayer(`trail-${trailId}`);
        map.removeSource(`trail-${trailId}`);
      }

      clearAllMarkers(trailId);
    }

    await getTrails();
  },
);

async function handleCreatePost(content, media) {
  const res = await fetchy(`/api/posts`, "POST", { body: { content, media, event: undefined } });

  // get post id to associate with trail
  const postId = res.post._id;

  // get copy of the trail's list of locations
  const newLocations = trail.value.locations;

  // get location entry
  let selectedLocation = newLocations[selected.value.postIndex];

  // create new location object with postId added
  let newLocation = { ...selectedLocation, post: postId };

  // substitue it into the list of locations
  newLocations[selected.value.postIndex] = newLocation;

  // update the trail with its new locations
  await fetchy(`/api/trails/${trail.value._id}`, "PATCH", { body: { locations: newLocations } });

  // emit to parent to update list of trails
  selectedPostId.value = postId;
  emit("refreshTrails");

  await getPost(postId);
  // await getTrails();
}

async function handleDeleteTrail(trailId) {
  await fetchy(`/api/trails/${trailId}`, "DELETE");

  showCard.value = false;
  selected.value = { trailId: null, postIndex: null };

  emit("refreshTrails");
}
</script>

<template>
  <div :id="props.mapRef" class="mapContainer"></div>
  <v-sheet class="legend" :elevation="2">
    <h6>Legend</h6>
    <div>
      <div class="mine"></div>
      <p>My trail</p>
    </div>
    <div>
      <div class="friend"></div>
      <p>My friend's trail</p>
    </div>
    <div>
      <div class="other"></div>
      <p>Someone else's trail</p>
    </div>
  </v-sheet>
  <div v-if="!loading">
    <v-sheet v-if="showCard" rounded class="post-sheet">
      <div v-if="trail">
        <div class="row">
          <div class="row row-gap">
            <h3>{{ trail.name }}</h3>
            <v-icon v-if="currentUsername === trail.author" @click="handleDeleteTrail(trail._id)" color="error">mdi-delete-outline</v-icon>
          </div>
          <v-icon @click="closeForm">mdi-close</v-icon>
        </div>

        <!-- TODO: clicking on author takes them to their profile -->

        <h4>{{ trail.author }}</h4>
        <h6>{{ trail.distance }} miles</h6>
        <h6>{{ trail.duration }} hours</h6>
        <h6 v-if="post && selectedPostId">{{ getCoordinates(trail) }}</h6>
      </div>

      <PostComponent v-if="post" :post="post" @handleDeletePost="handleDeletePost" />
      <div v-else class="gap">
        <CreatePostForm v-if="currentUsername === trail.author" @handleCreatePost="handleCreatePost" />
        <div class="center background">No post found for this location!</div>
      </div>
    </v-sheet>
  </div>
  <div v-else-if="loading && showCard">
    <v-sheet class="load-sheet post-sheet"> <v-progress-circular indeterminate color="#95b08d"></v-progress-circular> </v-sheet>
  </div>
</template>

<style scoped>
.legend {
  position: absolute;
  padding: 1em;
  bottom: 2em;
  left: 2em;
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.legend > div {
  display: flex;
  flex-direction: row;
  gap: 1em;
  font-size: 12px;
  align-items: center;
}

.legend > div > div {
  padding: 0.5em;
  aspect-ratio: 1;
}
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

.post-sheet {
  display: flex;
  flex-direction: column;
  row-gap: 1.5em;
  position: absolute;
  top: 2em;
  right: 2em;
  padding: 1em;
  max-width: 40%;
  height: calc(100% - 4em);
  overflow-y: scroll;
  background-color: #ffffffe9;
  min-width: 400px;
}

.load-sheet.post-sheet {
  justify-content: center;
  align-items: center;
}

.row-gap {
  gap: 0.5em;
}
</style>
