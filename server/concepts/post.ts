import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface PostDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  event: ObjectId | undefined;
  media?: string;
}

export default class PostConcept {
  public readonly posts = new DocCollection<PostDoc>("posts");

  async create(author: ObjectId, content: string, event: ObjectId | undefined, media?: string) {
    if (!content) {
      throw new PostContentEmptyError();
    }
    const _id = await this.posts.createOne({ author, content, media, event });
    return { msg: "Post successfully created!", post: await this.posts.readOne({ _id }) };
  }

  async getPosts(query: Filter<PostDoc>) {
    const posts = await this.posts.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
  }

  async getById(id: ObjectId) {
    return await this.posts.readOne(
      { _id: id },
      {
        sort: { dateUpdated: -1 },
      },
    );
  }

  async getByAuthor(author: ObjectId) {
    return await this.getPosts({ author });
  }

  async update(_id: ObjectId, update: Partial<PostDoc>) {
    this.sanitizeUpdate(update);
    await this.posts.updateOne({ _id }, update);
    return { msg: "Post successfully updated!" };
  }

  async delete(_id: ObjectId) {
    await this.posts.deleteOne({ _id });
    return { msg: "Post deleted successfully!" };
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post ${_id} does not exist!`);
    }
    if (post.author.toString() !== user.toString()) {
      throw new PostAuthorNotMatchError(user, _id);
    }
  }

  async postExists(_id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post ${_id} does not exist!`);
    }
  }

  private sanitizeUpdate(update: Partial<PostDoc>) {
    // make sure there is something to update
    if (!update) {
      throw new PostUpdateEmptyError();
    }

    // Make sure the update cannot change the author.
    const allowedUpdates = ["content", "options"];
    for (const [key, value] of Object.entries(update)) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }

      // make sure we can't edit the content to empty
      if (key === "content" && !value) {
        throw new PostContentEmptyError();
      }
    }
  }
}

export class PostAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}

export class PostContentEmptyError extends BadValuesError {
  constructor() {
    super("Can not create post with empty content!");
  }
}

export class PostUpdateEmptyError extends BadValuesError {
  constructor() {
    super("Empty post update!");
  }
}
