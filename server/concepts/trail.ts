import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface Location {
  location: { lat: number; lng: number };
  item?: ObjectId;
}

export interface TrailDoc extends BaseDoc {
  author: ObjectId;
  name: string;
  description: string;
  locations: Location[];
  pinned: boolean;
}

export default class TrailConcept {
  public readonly trails = new DocCollection<TrailDoc>("trails");

  /** create new trail */
  async create(author: ObjectId, name: string, description: string, locations: Location[]) {
    if (!name) {
      throw new TrailFieldMissing("name");
    }

    if (!description) {
      throw new TrailFieldMissing("description");
    }

    if (!locations) locations = [];

    const _id = await this.trails.createOne({ author, name, description, locations });
    return { msg: "Trail successfully created!", trail: await this.trails.readOne({ _id }) };
  }

  /** delete trail */
  async delete(_id: ObjectId) {
    await this.trails.deleteOne({ _id });
    return { msg: "Trail deleted successfully!" };
  }

  /** get trail by id */
  async get(_id: ObjectId) {
    return await this.trails.readOne({ _id });
  }

  /** update trail */
  async update(_id: ObjectId, update: Partial<TrailDoc>) {
    this.sanitizeUpdate(update);
    await this.trails.updateOne({ _id }, update);
    return { msg: "Trail successfully updated!" };
  }

  /** get trails according to filter */
  async getTrails(query: Filter<TrailDoc>) {
    const trails = await this.trails.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return trails;
  }

  async getTrailsByAuthor(author: ObjectId) {
    return await this.getTrails({ author });
  }

  /** check if user is the author of a trail */
  async isAuthor(user: ObjectId, _id: ObjectId) {
    const trail = await this.trails.readOne({ _id });
    if (!trail) {
      throw new NotFoundError(`Trail ${_id} does not exist!`);
    }
    if (trail.author.toString() !== user.toString()) {
      throw new TrailAuthorNotMatchError(user, _id);
    }
  }

  async checkAvailablePin(user: ObjectId) {
    const pinnedTrails = await this.trails.readMany({ author: user, pinned: true });
    if (pinnedTrails.length === 5) {
      throw new PinnedTrailLimitMet(user);
    }
  }

  private sanitizeUpdate(update: Partial<TrailDoc>) {
    // Make sure the update cannot change the owner.
    if (!update) {
      throw new BadValuesError("No updates provided for Trail");
    }
    const allowedUpdates = ["locations", "name", "description"];
    for (const [key, value] of Object.entries(update)) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }

      // Make sure name and description aren't empty

      if (!value && key === "name") {
        throw new TrailFieldMissing("name");
      }

      if (!value && key === "description") {
        throw new TrailFieldMissing("description");
      }
    }
  }

  async trailExists(_id: ObjectId) {
    const trail = await this.trails.readOne({ _id });
    if (!trail) {
      throw new NotFoundError(`Trail ${_id} does not exist!`);
    }
  }
}

export class PinnedTrailLimitMet extends NotAllowedError {
  constructor(public readonly user: ObjectId) {
    super("Max number of pins met!");
  }
}

export class TrailAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of trail {1}!", user, _id);
  }
}

export class TrailFieldMissing extends BadValuesError {
  constructor(public readonly missingField: string) {
    super("Missing a required {0} field to create a trail!", missingField);
  }
}
