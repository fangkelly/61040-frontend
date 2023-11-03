import { User } from "./app";
import { CommentDoc } from "./concepts/comment";
import { EventDoc } from "./concepts/event";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friend";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/post";
import { TrailDoc } from "./concepts/trail";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await User.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await User.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await User.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }

  /**
   * Convert EventDoc into more readable format for the frontend
   * by converting the owner id into a username
   */
  static async event(event: EventDoc | null) {
    if (!event) {
      return event;
    }
    const owner = await User.getUserById(event.owner);
    return { ...event, owner: owner.username };
  }

  /**
   * Same as {@link event} but for an array of EventDoc for improved performance.
   */
  static async events(events: EventDoc[]) {
    const owners = await User.idsToUsernames(events.map((event) => event.owner));
    return events.map((event, i) => ({ ...event, owner: owners[i] }));
  }

  /**
   * Convert CommentDoc into more readable format for the frontend
   * by converting the author id into a username
   */
  static async comment(comment: CommentDoc | null) {
    if (!comment) {
      return comment;
    }
    const author = await User.getUserById(comment.author);
    return { ...comment, author: author.username };
  }

  /**
   * Same as {@link comment} but for an array of EventDoc for improved performance.
   */
  static async comments(comments: CommentDoc[]) {
    const owners = await User.idsToUsernames(comments.map((comment) => comment.author));
    return comments.map((comment, i) => ({ ...comment, author: owners[i] }));
  }
  /**
   * Convert TrailDoc into more readable format for the frontend
   * by converting the author id into a username
   */
  static async trail(trail: TrailDoc | null) {
    if (!trail) {
      return trail;
    }

    if (trail.author) {
      const author = await User.getUserById(trail.author);
      return { ...trail, author: author.username };
    }

    return { ...trail, author: undefined };
  }

  /**
   * Same as {@link comment} but for an array of EventDoc for improved performance.
   */
  static async trails(trails: TrailDoc[]) {
    const owners = await User.idsToUsernames(trails.map((trail) => trail.author));
    return trails.map((trail, i) => ({ ...trail, author: owners[i] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await User.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});
