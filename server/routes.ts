import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Comment, Event, Friend, Post, Trail, User, WebSession } from "./app";
import { CommentDoc } from "./concepts/comment";
import { NotFoundError } from "./concepts/errors";
import { EventDoc } from "./concepts/event";
import { PostDoc, PostOptions } from "./concepts/post";
import { TrailDoc } from "./concepts/trail";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  /** Session Routes */
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  /** Users Routes */
  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  /** Posts Routes */
  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    await Post.delete(_id);

    // delete all comments associated with post
    const comments = await Comment.getByPost(_id);
    comments.map(async (comment) => {
      await Comment.delete(comment._id);
    });

    return { msg: "Deleted post and all comments associated with it!" };
  }

  /** Comments Routes */
  @Router.post("/comments")
  async createComment(session: WebSessionDoc, content: string, target: ObjectId) {
    const user = WebSession.getUser(session);
    // make sure target to attach comment to exists
    await Post.postExists(target);
    const created = await Comment.create(user, content, target);
    return { msg: created.msg, comment: await Responses.comment(created.comment) };
  }

  @Router.delete("/comments/:_id")
  async deleteComment(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Comment.isAuthor(user, _id);
    return Comment.delete(_id);
  }

  @Router.patch("/comments/:_id")
  async updateComment(session: WebSessionDoc, _id: ObjectId, update: Partial<CommentDoc>) {
    const user = WebSession.getUser(session);
    await Comment.isAuthor(user, _id);
    return await Comment.update(_id, update);
  }

  @Router.get("/comments")
  async getComments(target: ObjectId) {
    if (!target) {
      return await Responses.comments(await Comment.getComments({}));
    }

    return await Responses.comments(await Comment.getByPost(target));
  }

  /** Friends Routes */
  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  /** Events Routes */

  @Router.patch("/events/:_id")
  async updateEvent(session: WebSessionDoc, _id: ObjectId, update: Partial<EventDoc>) {
    const user = WebSession.getUser(session);
    await Event.isOwner(user, _id);
    return await Event.update(_id, update);
  }

  @Router.get("/events")
  async getEvents(owner?: string) {
    let events;
    if (owner) {
      const id = (await User.getUserByUsername(owner))._id;
      events = await Event.getByOwner(id);
    } else {
      events = await Event.getEvents({});
    }
    return Responses.events(events);
  }

  @Router.get("/events/registered")
  async getRegisteredEvents(user: string) {
    const id = (await User.getUserByUsername(user))._id;
    const events = await Event.getRegisteredEvents(id);
    return Responses.events(events);
  }

  @Router.patch("/events/:_id/register")
  async registerEvent(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    /** synchronization; automatically create trail with locations populated but empty posts for user to update later on */
    const event = await Event.getEvent(_id);
    if (event) {
      const eventTrail = await Trail.get(event.trail);
      const locations = eventTrail?.locations;
      if (locations) {
        await Event.register(_id, user);
        return await Trail.create(user, event?.name, event?.description, locations, eventTrail.duration, eventTrail.distance);
      } else {
        throw new NotFoundError("Could not register event for user");
      }
    } else {
      throw new NotFoundError("Event {0} does not exist", _id);
    }
  }

  @Router.patch("/events/:_id/unregister")
  async unregisterEvent(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Event.unregister(_id, user);
  }

  @Router.get("/events/:_id/attendees")
  async getAttendees(_id: ObjectId) {
    const attendees = await Event.getAttendees(_id);
    const attendeesPromises = attendees.map(async (a) => {
      return await User.getUserById(new ObjectId(a));
    });
    const resoleved = await Promise.all(attendeesPromises);
    return resoleved;
  }

  @Router.post("/events")
  async createEvent(
    session: WebSessionDoc,
    body: {
      name: string;
      description: string;
      date: { month: string; date: string; year: string };
      time: { hour: string; minute: string; am: boolean };
      tags: {
        terrain: Array<string>;
        activity: Array<string>;
        other: Array<string>;
        difficulty: string;
      };
      checklist: Array<Record<string, number>>;
      trail: ObjectId;
    },
  ) {
    const user = WebSession.getUser(session);
    await Trail.trailExists(body.trail);
    const created = await Event.create({ ...body, owner: user, posts: [], attendees: [] });
    // register yourself for event you created also (or should this happen in the front end? which makes 2 separate calls)
    if (created) {
      if (created.event?._id) {
        const eventTrail = await Trail.get(body.trail);
        const locations = eventTrail?.locations;
        await Event.register(created.event?._id, user);
        if (locations) {
          await Trail.create(user, body.name, body.description, locations, eventTrail.duration, eventTrail.distance);
        } else {
          throw new NotFoundError("Created trail but could not create a copy of the trail for the user");
        }
        return { msg: created.msg, event: await Responses.event(await Event.getEvent(created.event._id)) };
      } else {
        throw new NotFoundError("Could not create event");
      }
    }
    throw new NotFoundError("Could not create event");
  }

  @Router.delete("/events/:_id")
  async deleteEvent(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Event.isOwner(user, _id);
    const event = await Event.getEvent(_id);

    event?.posts.map(async (post) => {
      // delete comments associated with post of event
      const comments = await Comment.getByPost(post);
      comments.map(async (comment) => {
        await Comment.delete(comment._id);
      });

      // delete posts associated with event
      await Post.delete(post);
    });

    return await Event.delete(_id);
  }

  /** make post to an event only if the user is registered for it */
  @Router.patch("/events/:_id/post")
  async postToEvent(session: WebSessionDoc, _id: ObjectId, text: string, options: PostOptions) {
    const user = WebSession.getUser(session);
    await Event.isRegistered(user, _id);
    const created = await Post.create(user, text, options);
    return await Event.addPost(_id, created.post?._id);
  }

  /** delete post from an event */
  @Router.patch("/events/:_id/delete_post/:_postId")
  async DeleteFromEvent(session: WebSessionDoc, _id: ObjectId, postId: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, postId);
    return await Event.deletePost(_id, postId);
  }

  /** Trails Routes */
  @Router.post("/trails")
  async createTrail(session: WebSessionDoc, body: { name: string; description: string; locations: Array<{ lat: number; lng: number; post?: ObjectId }>; duration: number; distance: number }) {
    console.log("BODY ", body);
    const author = WebSession.getUser(session);
    const created = await Trail.create(author, body.name, body.description, body.locations, body.distance, body.duration);
    return { msg: created.msg, trail: await Responses.trail(created.trail) };
  }

  @Router.delete("/trails/:_id")
  async deleteTrail(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Trail.isAuthor(user, _id);
    return Trail.delete(_id);
  }

  @Router.get("/trails")
  async getTrails(author?: string) {
    let trails;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      trails = await Trail.getTrailsByAuthor(id);
    } else {
      trails = await Trail.getTrails({});
    }
    return await Responses.trails(trails);
  }

  @Router.patch("/trails/:_id")
  async updateTrail(session: WebSessionDoc, _id: ObjectId, update: Partial<TrailDoc>) {
    const user = WebSession.getUser(session);
    await Trail.isAuthor(user, _id);
    return await Trail.update(_id, update);
  }

  @Router.patch("/trails/:_id/pin")
  async pinTrail(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Trail.isAuthor(user, _id);
    await Trail.checkAvailablePin(user);
    return await Trail.update(_id, { pinned: true });
  }

  @Router.patch("/trails/:_id/unpin")
  async unpinTrail(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Trail.isAuthor(user, _id);
    return await Trail.update(_id, { pinned: false });
  }
}

export default getExpressRouter(new Routes());
