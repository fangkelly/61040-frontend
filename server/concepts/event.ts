import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface EventDoc extends BaseDoc {
  owner: ObjectId;
  name: string;
  description: string;
  date: { month: string; date: string; year: string };
  time: { hour: string; minute: string; am: boolean };
  attendees: Array<ObjectId>;
  tags: {
    terrain: Array<string>;
    activity: Array<string>;
    other: Array<string>;
    difficulty: Array<string>;
  };
  checklist: Array<Record<string, number>>;
  posts: Array<ObjectId>;
  trail: ObjectId;
}

export interface Event {
  owner: ObjectId;
  name: string;
  description: string;
  date: { month: string; date: string; year: string };
  time: { hour: string; minute: string; am: boolean };
  attendees: Array<ObjectId>;
  tags: {
    terrain: Array<string>;
    activity: Array<string>;
    other: Array<string>;
    difficulty: Array<string>;
  };
  checklist: Array<Record<string, number>>;
  posts: Array<ObjectId>;
  trail: ObjectId;
}

export default class EventConcept {
  public readonly events = new DocCollection<EventDoc>("events");

  /** create new event */
  async create(event: Event) {
    if (!event.owner) {
      throw new BadValuesError("Event must have an owner!");
    }

    if (!event.name) {
      throw new BadValuesError("Event must have a name!");
    }

    if (!event.date) {
      throw new BadValuesError("Event must have a date!");
    }

    if (!event.time) {
      throw new BadValuesError("Event must have a time!");
    }

    const _id = await this.events.createOne(event);
    return { msg: "Event successfully created!", event: await this.events.readOne({ _id }) };
  }

  /** get one event */
  async getEvent(_id: ObjectId) {
    const event = await this.events.readOne({ _id });
    return event;
  }

  /** get events that match filter */
  async getEvents(query: Filter<EventDoc>) {
    const events = await this.events.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return events;
  }

  /** get events a user is registered for */
  async getRegisteredEvents(user: ObjectId) {
    const events = await this.events.readMany({
      attendees: user,
    });
    return events;
  }

  /** get events by owner */
  async getByOwner(owner: ObjectId) {
    return await this.getEvents({ owner });
  }

  /** update event */
  async update(_id: ObjectId, update: Partial<EventDoc>) {
    this.sanitizeUpdate(update);
    await this.events.updateOne({ _id }, update);
    return { msg: "Event successfully updated!" };
  }

  /** delete event */
  async delete(_id: ObjectId) {
    await this.events.deleteOne({ _id });
    return { msg: "Event deleted successfully!" };
  }

  /** registers a user for an event */
  async register(_id: ObjectId, user: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    }

    if (event.attendees.includes(user)) {
      throw new AlreadyRegisteredError(user, _id);
    } else {
      const attendees = [...event.attendees, user];
      await this.update(_id, { attendees });
      return { msg: `User ${user} registered for Event ${_id} successfully!` };
    }
  }

  /** unregisters a user for an event */
  async unregister(_id: ObjectId, user: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    }

    if (user.toString() === event.owner.toString()) {
      throw new NotAllowedError("Owner can't unregister from their own event!");
    }

    if (!event.attendees.indexOf(user)) {
      throw new AlreadyUnregisteredError(user, _id);
    } else {
      console.log("event.attendees ", event.attendees);
      const attendees = event.attendees.filter((a) => a.toString() !== user.toString());
      console.log("attendees ", attendees);
      await this.update(_id, { attendees });
      return { msg: `User ${user} unregistered for Event ${_id} successfully!` };
    }
  }

  /** check if user is the owner of an event */
  async isOwner(user: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    }
    if (event.owner.toString() !== user.toString()) {
      throw new EventOwnerNotMatchError(user, _id);
    }
  }

  /** check if user is registered for an event */
  async isRegistered(user: ObjectId, _id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    }
    if (!event.attendees.map((a) => a.toString()).includes(user.toString())) {
      throw new NotRegistedError(user, _id);
    }
  }

  async getAttendees(_id: ObjectId) {
    const event = await this.events.readOne({ _id });
    if (!event) {
      throw new NotFoundError(`Event ${_id} does not exist!`);
    } else {
      return event.attendees;
    }
  }

  /** add association of post to event */
  async addPost(_id: ObjectId, postId: ObjectId | undefined) {
    if (!postId) {
      throw new NotFoundError("Post undefined; Cannot make post {0} to event {1}", postId, _id);
    } else {
      let posts;
      const event = await this.events.readOne({ _id });
      if (event) {
        const oldPosts = event.posts;
        posts = [...oldPosts, postId];
        await this.events.updateOne({ _id }, { posts });
        return { msg: `Added post ${postId} to Event ${_id} successfully!` };
      } else {
        throw new NotFoundError("Could not find event {0}", _id);
      }
    }
  }

  /** remove association of post from event */
  async deletePost(_id: ObjectId, postId: ObjectId | undefined) {
    if (!postId) {
      throw new NotFoundError("Post not found; Cannot make delete post from event {1}", postId, _id);
    } else {
      let posts;
      const event = await this.events.readOne({ _id });
      if (event) {
        const oldPosts = event.posts;
        const oldPostsString = oldPosts.map((p) => p.toString());
        const postIndex = oldPostsString.indexOf(postId.toString());
        if (postIndex < 0) throw new NotFoundError("Could not find post in event!");
        posts = oldPosts.filter((p) => p.toString() !== postId.toString());
        await this.events.updateOne({ _id }, { posts });
        return { msg: `Deleted post ${postId} from Event ${_id} successfully!` };
      } else {
        throw new NotFoundError("Could not find event {0}", _id);
      }
    }
  }

  private sanitizeUpdate(update: Partial<EventDoc>) {
    // Make sure the update cannot change the owner or posts.
    if (!update) {
      throw new EventUpdateEmptyError();
    }
    const allowedUpdates = ["name", "description", "start_date", "attendees", "tags", "checklist", "trail"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class EventNotFound extends NotFoundError {
  constructor(_id: ObjectId) {
    super("Event {0} not found!", _id);
  }
}

export class EventUpdateEmptyError extends BadValuesError {
  constructor() {
    super("No update provided to Event!");
  }
}

export class EventOwnerNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the owner of event {1}!", user, _id);
  }
}

export class NotRegistedError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not registered for event {1}!", user, _id);
  }
}

export class AlreadyRegisteredError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is already registered for event {1}!", user, _id);
  }
}

export class AlreadyUnregisteredError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is already unregistered for event {1}!", user, _id);
  }
}
