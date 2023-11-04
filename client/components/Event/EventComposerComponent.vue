<script setup lang="ts">
// @ts-nocheck
import TrailComposerComponentVue from "@/components/Trail/TrailComposerComponent.vue";
import TrailPickerComponent from "@/components/Trail/TrailPickerComponent.vue";
import { ref } from "vue";
import { useToastStore } from "../../stores/toast";
import { fetchy } from "../../utils/fetchy";

const props = defineProps(["trails"]);
const emit = defineEmits(["refreshTrails"]);

/** optional tags and the associated refs for storing them */
const difficultyTags = ["Beginner", "Intermediate", "Expert", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];
let difficulty = ref([]);

const activityTags = ["Camping", "Running", "Climbing", "Fishing", "Swimming", "Backpacking", "Biking", "Ski", "Ice Climbing"];
let activity = ref([]);

const otherTags = ["Dog-friendly", "Children-friendly", "Educational", "Social", "Scenic"];
let other = ref([]);

const terrainTags = ["Hill", "Mountain", "Canyon", "Forest", "Desert"];
let terrain = ref([]);

/** suggested checklist items and refs for storing them */
const checklistItems = [
  "Hiking Shoes",
  "Headlamp",
  "Tent",
  "Sleeping bag",
  "Hiking Pole",
  "Multi-tool",
  "Jacket",
  "Trail-running Shoes",
  "Insect repellant",
  "SPF",
  "Climbing Rope",
  "Climbing Harness",
  "Helmet",
  "Climbing Shoes",
];
let checklist = ref<Array<Record<string, string>>>([{ item: "", qty: "1" }]);

function addItem() {
  checklist.value.push({
    item: "",
    qty: "1",
  });
}
function deleteItem(index: number) {
  checklist.value.splice(index, 1);
}

const getRemainingItems = () => {
  const addedItems = checklist.value.map((entry) => {
    return entry.item;
  });

  const filteredChecklistItems = checklistItems.filter((item) => {
    if (addedItems.indexOf(item) < 0) return item;
  });

  return filteredChecklistItems;
};

/** refs for storing basic form values */
let showForm = ref(false);
let eventName = ref("");
let eventDescription = ref("");
let date = ref();

/** refs for managing form pages */
let currentPage = ref(0);
let validDetails = ref(false);
let validLocation = ref(true);

const nameRules = [
  (value: string) => {
    if (value) return true;

    return "You must enter a name for your event.";
  },
];

const descriptionRules = [
  (value: string) => {
    if (value) return true;

    return "You must enter a description for your event.";
  },
];

const dateRules = [
  /** check selected date is not in the past */
  (selectedDate: string) => {
    const formattedSelected = new Date(selectedDate);
    const formattedCurrent = new Date();
    if (formattedSelected >= formattedCurrent) return true;
    return "Please enter a future datetime!";
  },

  /** non-empty field rule */
  (value: string) => {
    if (value) return true;

    return "You must enter a date and time for your event.";
  },
];

const quantityRules = [
  (v) => {
    if (v > 0) return true;
    return "Quantity must be greater than 0!";
  },
];

/** deals with trail selection and visualization */
let selectedTrail = ref();
let trailName = ref("");
let trailDescription = ref("");
let draftTrail = ref(false);
let trailDistance = ref(0);
let trailDuration = ref(0);
let composedTrail = ref([{ lng: ``, lat: `` }]);
let correctTrail = ref();

const updateComposedTrail = (trail) => {
  composedTrail.value = [...trail];
};

/** functions for handling the creation of event */
const createEvent = async () => {
  let trail;

  if (draftTrail.value) {
    const trailJSON = JSON.parse(JSON.stringify(correctTrail.value));
    trail = {
      name: trailName.value,
      description: trailDescription.value,
      locations: trailJSON,
      distance: trailDistance.value,
      duration: trailDuration.value,
    };
  } else {
    const trailJSON = JSON.parse(JSON.stringify(selectedTrail.value));
    trail = {
      author: trailJSON.author,
      name: trailJSON.name,
      description: trailJSON.description,
      locations: trailJSON.locations,
      distance: trailJSON.distance,
      duration: trailJSON.duration,
    };
  }

  let trailResponse;

  if (draftTrail.value) {
    trailResponse = await fetchy(`/api/trails`, "POST", { body: trail });

    useToastStore().showToast({ message: trailResponse.message, style: trailResponse.ok ? "success" : "error" });
  }

  const dateTime = date.value.split("T");
  const dateArray = dateTime[0].split("-");
  const year = dateArray[0];
  const month = dateArray[1];
  const d = dateArray[2];
  const timeArray = dateTime[1].split(":");
  const hour = timeArray[0] % 12 === 0 ? 12 : timeArray[0] % 12;
  const minute = timeArray[1];
  const am = timeArray[0] < 12;

  const sanitizedDate = {
    year,
    month,
    date: d,
  };

  const sanitizedTime = {
    hour: hour.toString(),
    minute,
    am,
  };

  const event = {
    name: eventName.value,
    description: eventDescription.value,
    date: sanitizedDate,
    time: sanitizedTime,
    tags: {
      difficulty: difficulty.value.length > 0 ? JSON.parse(JSON.stringify(difficulty.value)) : [],
      activity: activity.value.length > 0 ? JSON.parse(JSON.stringify(activity.value)) : [],
      terrain: terrain.value.length > 0 ? JSON.parse(JSON.stringify(terrain.value)) : [],
      other: other.value.length > 0 ? JSON.parse(JSON.stringify(other.value)) : [],
    },
    trail: draftTrail.value ? trailResponse.trail._id : selectedTrail.value._id,
    checklist: JSON.parse(JSON.stringify(checklist.value)),
  };

  const eventResponse = await fetchy(`/api/events`, "POST", { body: event });

  useToastStore().showToast({ message: eventResponse.msg, style: eventResponse.ok ? "success" : "error" });

  emit("refreshTrails");
  emptyForm();
};

const emptyForm = () => {
  difficulty.value = [];
  terrain.value = [];
  activity.value = [];
  other.value = [];
  checklist.value = [{ item: "", qty: "1" }];

  eventName.value = "";
  eventDescription.value = "";
  date.value = "";

  currentPage.value = 0;
  validDetails.value = false;
  validLocation.value = false;

  selectedTrail.value = ref();
  trailName.value = "";
  trailDescription.value = "";
  draftTrail.value = false;
  trailDistance.value = 0;
  trailDuration.value = 0;
  composedTrail.value = [{ lng: ``, lat: `` }];

  showForm.value = false;
};

function toggleForm() {
  showForm.value = !showForm.value;
}
</script>

<template>
  <v-icon @click="toggleForm()" color="white">mdi-calendar-plus </v-icon>
  <v-dialog v-model="showForm" transition="dialog-bottom-transition">
    <div class="form-card">
      <div>
        <section class="form-header">
          <h3>Create a new event</h3>
          <v-icon @click="showForm = false">mdi-close</v-icon>
        </section>
        <v-divider></v-divider>
      </div>
      <v-form v-if="currentPage === 0" v-model="validDetails" class="form-body">
        <v-row
          ><v-col cols="6" md="6" sm="12">
            <div class="section">
              <h4>Basic Info</h4>
              <v-text-field variant="outlined" color="#95b08d" v-model="eventName" label="Event name" required :rules="nameRules"></v-text-field>
              <v-textarea variant="outlined" color="#95b08d" v-model="eventDescription" label="Event description" required single-line :rules="descriptionRules"></v-textarea>
            </div>
            <div class="section">
              <h4>Date & Time</h4>
              <v-text-field variant="outlined" color="#95b08d" v-model="date" label="Date" type="datetime-local" min="{new Date().toISOString().split('T')[0]}" :rules="dateRules"></v-text-field>
            </div>
          </v-col>

          <v-col>
            <div class="section">
              <h4>Tags</h4>
              <v-select v-model="difficulty" :items="difficultyTags" label="Level of Difficulty" multiple color="#95b08d" variant="outlined"></v-select>
              <v-select v-model="terrain" :items="terrainTags" chips label="Terrain" multiple color="#95b08d" variant="outlined"></v-select>
              <v-select v-model="activity" :items="activityTags" chips label="Activity" multiple color="#95b08d" variant="outlined"></v-select>
              <v-select v-model="other" :items="otherTags" chips label="Other" multiple color="#95b08d" variant="outlined"></v-select>
            </div>
          </v-col>
        </v-row>
      </v-form>

      <v-form v-model="validLocation" v-if="currentPage === 1" class="form-body">
        <div class="section">
          <div class="space-between">
            <h4>Event Location</h4>
            <button v-if="!draftTrail" type="button" id="create-trail-btn" @click="draftTrail = true">Create Trail <v-icon color="#474747" size="x-small">mdi-pencil</v-icon></button>
            <button v-else type="button" id="create-trail-btn" @click="draftTrail = false">Find Trail <v-icon color="#474747" size="x-small">mdi-archive</v-icon></button>
          </div>
          <TrailPickerComponent v-if="!draftTrail" :trails="props.trails" :trail-value="selectedTrail" @update:trail-value="(newTrail) => (selectedTrail = newTrail)" />
          <TrailComposerComponentVue
            v-else
            :name-value="trailName"
            @update:name-value="
              (newTrailName) => {
                trailName = newTrailName;
              }
            "
            :description-value="trailDescription"
            @update:description-value="(newTrailDescription) => (trailDescription = newTrailDescription)"
            @update:trail-value="updateComposedTrail"
            :trail-value="composedTrail"
            :distance-value="trailDistance"
            @update:distance-value="(newTrailDistance) => (trailDistance = newTrailDistance)"
            @update:duration-value="(newTrailDuration) => (trailDuration = newTrailDuration)"
            :duration-value="trailDuration"
            @update:corrected-trail-value="
              (trail) => {
                correctTrail = trail;
              }
            "
          />
        </div>
      </v-form>

      <div v-if="currentPage === 2" class="form-body">
        <div class="section">
          <h4>Checklist</h4>
          <h5>What should each person bring? (You can type in your own custom items)</h5>
          <v-form scrollable>
            <div class="section">
              <div class="checklist-row" v-for="(entry, counter) in checklist" v-bind:key="counter">
                <v-combobox
                  v-model="entry.item"
                  class="combo-box"
                  clearable
                  density="compact"
                  v-bind:label="`Item ${counter + 1}`"
                  :items="getRemainingItems()"
                  color="#95b08d"
                  variant="outlined"
                ></v-combobox>
                <v-text-field v-model="entry.qty" single-line type="number" width="100" density="compact" variant="outlined" color="#95b08d" label="Qty." :rules="quantityRules"></v-text-field>
                <v-icon @click="deleteItem(counter)" size="x-small">mdi-close</v-icon>
              </div>
              <div class="center">
                <button id="add-item-btn" @click="addItem" type="button">Add another item <v-icon size="x-small">mdi-plus</v-icon></button>
              </div>
            </div>
          </v-form>
        </div>
      </div>

      <div>
        <section class="form-footer">
          <v-divider></v-divider>
          <div class="action-container">
            <v-btn variant="outlined" :disabled="currentPage === 0" @click="currentPage = currentPage - 1"> Back </v-btn>
            <v-btn variant="outlined" v-if="currentPage < 2" @click="currentPage = currentPage + 1" :disabled="currentPage === 0 ? !validDetails : currentPage == 1 ? !validLocation : false">
              Next
            </v-btn>
            <v-btn v-else @click="createEvent" variant="outlined" type="button"> Create Event </v-btn>
          </div>
        </section>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
@import "../../assets/toast.css";

.combo-box {
  width: 400px;
}

.form-body {
  flex: 1;
  padding: 1em 0;
}

.section > * {
  padding-bottom: 1em;
}
v-btn {
  background-color: transparent;
}

h3,
h4,
h5 {
  color: #626262;
}

.form-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-bottom: 0.5em;
}

.form-card {
  min-width: 80vw;
  max-width: 1000px;
  height: 85vh;
  width: fit-content;
  align-self: center;
  background-color: white;
  padding: 2em;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: scroll;
}

.time-input {
  width: 200px;
  display: flex;
  flex-direction: row;
  column-gap: 0.5em;
  align-items: center;
}
.v-picker__actions button:first-child {
  display: none !important;
}

.action-button {
  border: 1px solid #474747;
  color: #474747;
  font-size: 14px;
  font-weight: 100;
  cursor: pointer;
  width: max-content;
  height: max-content;
  border-radius: 30px;
  transition: all 0.25s ease-in;
  padding: 0.25em 1.5em;
}

.action-button:hover {
  background-color: white;
  border: 1px solid #95b08d;
}

.action-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-top: 1em;
}

.checklist {
  overflow-y: scroll;
  padding: 1em 0;
}
.checklist-row {
  display: flex;
  flex-direction: row;
  column-gap: 1em;
  align-items: start;
}

button {
  border: 1px solid #474747;
  color: #474747;
  font-size: 16px;
  font-weight: 100;
  cursor: pointer;
  border-radius: 30px;
  transition: all 0.25s ease-in;
  padding: 0.5em 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: 0.25em;
}

button > * {
  margin: 0;
}

#add-item-btn {
  font-size: 12px;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

#create-trail-btn {
  right: 0;
  font-size: 8;
}

.space-between {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
</style>
