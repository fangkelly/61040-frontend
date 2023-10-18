import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface Destination {
  location: [number, number];
  item?: ObjectId;
}

export interface TrailDoc extends BaseDoc {
  author: ObjectId;
  name: string;
  destinations: Destination[];
}

export default class TrailConcept {
  public readonly trails = new DocCollection<TrailDoc>("trails");

  /** create new trail */
  async create(author: ObjectId, name: string, destinations: Destination[]) {
    const _id = await this.trails.createOne({ author, name, destinations });
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

  /** update trail by adding a destination to the trail */
  async addDestination(_id: ObjectId, destination: Destination) {
    const trail = await this.trails.readOne({ _id });
    if (!trail) {
      throw new NotFoundError(`Trail ${_id} does not exist!`);
    }

    const destinations = [...trail.destinations, destination];
    await this.update(_id, { destinations });
    return { msg: `Trail ${trail.name} has been updated with destination ${destination} successfully!` };
  }

  /** get trails according to filter */
  async getTrails(query: Filter<TrailDoc>) {
    const trails = await this.trails.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return trails;
  }

  /** get trail by author */
  async getByAuthor(author: ObjectId) {
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

  private sanitizeUpdate(update: Partial<TrailDoc>) {
    // Make sure the update cannot change the owner.
    const allowedUpdates = ["destinations", "description"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
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
