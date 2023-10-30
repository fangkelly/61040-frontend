<script setup lang="ts">
import TrailComposerComponentVue from "@/components/Trail/TrailComposerComponent.vue";
import TrailPickerComponent from "@/components/Trail/TrailPickerComponent.vue";
import { ref } from "vue";

const props = defineProps(["trails"]);

/** optional tags and the associated refs for storing them */
const difficultyTags = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];
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
let checklist = ref<Array<Record<string, string>>>([{ item: "", qty: "" }]);

function addItem() {
  checklist.value.push({
    item: "",
    qty: "",
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

/** deals with trail selection and visualization */
let selectedTrail = ref();
const updateSelectedTrail = (trail) => {
  selectedTrail.value = trail;
};
let composedTrail = ref();
const updateComposedTrail = (trail) => {
  console.log("UPDATED COMPOSED TRAIL ", updateComposedTrail);
  composedTrail.value = trail;
};

let trailName = ref("");
const updateTrailName = (name) => {
  console.log("UPDATE TRAIL NAME with ", name);
  trailName.value = name;
};

let trailDescription = ref("");
const updateTrailDescription = (description) => {
  trailDescription.value = description;
};

let draftTrail = ref(false);

/** functions for handling the creation of event */
const createEvent = async () => {
  /** TODO */

  console.log("composed trail ", composedTrail);

  let trail;

  if (draftTrail.value) {
    trail = {
      name: trailName.value,
      description: trailDescription.value,
      // locations composedTrail.value:
    };
  }

  console.log("EVENT");

  console.log({
    name: eventName,
    description: eventDescription,
    datetime: date,
    difficulty: difficulty,
    activity: activity,
    terrain: terrain,
    trail: "",
    checklist: [],
  });

  // emptyForm();
};

const emptyForm = () => {
  /** TODO */
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
              <v-select v-model="difficulty" :items="difficultyTags" label="Level of Difficulty" color="#95b08d" variant="outlined"></v-select>
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
          <TrailPickerComponent v-if="!draftTrail" :trails="props.trails" @updateSelectedTrail="updateSelectedTrail" />
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
            @updateComposedTrail="updateComposedTrail"
            :locations="[{ lng: ``, lat: `` }]"
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
                <v-text-field v-model="entry.qty" single-line type="number" width="100" density="compact" variant="outlined" color="#95b08d" label="Qty."></v-text-field>
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
